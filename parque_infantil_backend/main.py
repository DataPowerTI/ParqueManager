from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt

import models, schemas
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

# Configurações JWT
SECRET_KEY = "sua_chave_secreta_super_segura" # Cuidado: em prod, use env vars
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 dia

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="Parque Infantil PRO", version="2.0.0")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependências ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.Usuario).filter(models.Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.role != "adm":
        raise HTTPException(status_code=403, detail="Acesso exclusivo para administradores.")
    return current_user

# --- Evento de Startup (Seed DB) ---
@app.on_event("startup")
def configure_defaults():
    db = SessionLocal()
    try:
        # Criar admin se nao existe
        admin = db.query(models.Usuario).filter(models.Usuario.username == "admin").first()
        if not admin:
            hashed_pw = get_password_hash("admin123")
            admin = models.Usuario(username="admin", password_hash=hashed_pw, role="adm")
            db.add(admin)
        
        # Criar usuario normal se não existe
        normal = db.query(models.Usuario).filter(models.Usuario.username == "operador").first()
        if not normal:
            hashed_pw_normal = get_password_hash("operador123")
            normal = models.Usuario(username="operador", password_hash=hashed_pw_normal, role="usuario")
            db.add(normal)

        # Criar config se não existe
        config = db.query(models.Configuracao).first()
        if not config:
            config = models.Configuracao(nome_empresa="Meu Parque Infantil")
            db.add(config)
        
        db.commit()
    finally:
        db.close()

# ==============================================================================
# AUTHENTICATION
# ==============================================================================

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UsuarioOut)
def get_me(current_user: models.Usuario = Depends(get_current_user)):
    return current_user

# ==============================================================================
# GESTÃO DE USUÁRIOS (Exclusivo Admin)
# ==============================================================================

@app.get("/usuarios", response_model=List[schemas.UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    return db.query(models.Usuario).all()

@app.post("/usuarios", response_model=schemas.UsuarioOut)
def criar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    existente = db.query(models.Usuario).filter(models.Usuario.username == usuario.username).first()
    if existente:
        raise HTTPException(status_code=400, detail="Nome de usuário já cadastrado.")
    
    hashed_pw = get_password_hash(usuario.password)
    db_user = models.Usuario(username=usuario.username, password_hash=hashed_pw, role=usuario.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/usuarios/{usuario_id}")
def remover_usuario(usuario_id: int, db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    if admin.id == usuario_id:
        raise HTTPException(status_code=400, detail="Você não pode remover seu próprio usuário.")
        
    user = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    db.delete(user)
    db.commit()
    return {"message": "Usuário removido com sucesso."}

# ==============================================================================
# CONFIGURAÇÕES (Livre p ler, Protegido p Editar)
# ==============================================================================

@app.get("/configuracoes", response_model=schemas.ConfiguracaoOut)
def get_config(db: Session = Depends(get_db)):
    return db.query(models.Configuracao).first()

@app.put("/configuracoes", response_model=schemas.ConfiguracaoOut)
def update_config(config_data: schemas.ConfiguracaoBase, db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    config = db.query(models.Configuracao).first()
    if config:
        config.nome_empresa = config_data.nome_empresa
        config.cnpj = config_data.cnpj
        db.commit()
        db.refresh(config)
    return config

# ==============================================================================
# TABELA DE PREÇOS
# ==============================================================================

@app.get("/precos", response_model=List[schemas.TabelaPrecoOut])
def listar_precos(db: Session = Depends(get_db)):
    return db.query(models.TabelaPreco).filter(models.TabelaPreco.ativo == 1).all()

@app.post("/precos", response_model=schemas.TabelaPrecoOut)
def criar_preco(preco: schemas.TabelaPrecoCreate, db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    db_preco = models.TabelaPreco(**preco.dict())
    db.add(db_preco)
    db.commit()
    db.refresh(db_preco)
    return db_preco

@app.delete("/precos/{preco_id}")
def remover_preco(preco_id: int, db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    preco = db.query(models.TabelaPreco).filter(models.TabelaPreco.id == preco_id).first()
    if not preco:
        raise HTTPException(status_code=404, detail="Preço não encontrado")
    preco.ativo = 0
    db.commit()
    return {"message": "Preço removido"}

# ==============================================================================
# RELATÓRIOS E FLUXO DE CAIXA (Exclusivo Admin)
# ==============================================================================

@app.get("/relatorios/hoje")
def relatorio_hoje(db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    import datetime as dt
    hoje = dt.datetime.utcnow().date()
    
    # Busca na memoria por simplicidade (SQLite e datas as vezes tem formatos diferentes dependendo do dialeto local)
    sessoes_hoje = [s for s in db.query(models.Sessao).all() if s.horario_inicio.date() == hoje]
    caixas_hoje = [c for c in db.query(models.Caixa).all() if c.data_abertura.date() == hoje]
    
    total_criancas = len(sessoes_hoje)
    faturamento_bruto = sum((c.valor_final or 0) - c.valor_inicial for c in caixas_hoje if c.status == "Fechado")
    
    pagamentos = {}
    for s in sessoes_hoje:
        if s.status == "Finalizado" and s.valor_pago is not None:
            k = s.forma_pagamento or "Dinheiro"
            pagamentos[k] = pagamentos.get(k, 0.0) + s.valor_pago
    
    return {
        "data": str(hoje),
        "total_criancas_brincaram": total_criancas,
        "faturamento_caixas_fechados": faturamento_bruto,
        "detalhamento_sessoes": pagamentos
    }

@app.get("/relatorios/mensal", response_model=schemas.RelatorioCaixaMensal)
def relatorio_mensal(mes: int, ano: int, db: Session = Depends(get_db), admin: models.Usuario = Depends(get_current_admin)):
    sessoes = db.query(models.Sessao).all()
    sessoes_mes = [s for s in sessoes if s.horario_inicio.month == mes and s.horario_inicio.year == ano]
    
    caixas = db.query(models.Caixa).filter(models.Caixa.status == "Fechado").all()
    caixas_mes = [c for c in caixas if c.data_fechamento and c.data_fechamento.month == mes and c.data_fechamento.year == ano]
    
    faturamento = sum((c.valor_final or 0) - c.valor_inicial for c in caixas_mes)
    
    pagamentos = {}
    for s in sessoes_mes:
        if s.status == "Finalizado" and s.valor_pago is not None:
            k = s.forma_pagamento or "Dinheiro"
            pagamentos[k] = pagamentos.get(k, 0.0) + s.valor_pago

    return {
        "faturamento_total": faturamento,
        "total_criancas": len(sessoes_mes),
        "mes_ano": f"{mes:02d}/{ano}",
        "pagamentos": pagamentos
    }

# ==============================================================================
# CAIXA (Protegido)
# ==============================================================================

@app.get("/caixa/status", response_model=Optional[schemas.CaixaOut])
def status_caixa(db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    caixa = db.query(models.Caixa).filter(models.Caixa.status == "Aberto").first()
    return caixa

@app.post("/caixa/abrir", response_model=schemas.CaixaOut)
def abrir_caixa(caixa: schemas.CaixaCreate, db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    caixa_aberta = db.query(models.Caixa).filter(models.Caixa.status == "Aberto").first()
    if caixa_aberta:
        raise HTTPException(status_code=400, detail="Já existe um caixa aberto.")
    
    db_caixa = models.Caixa(
        valor_inicial=caixa.valor_inicial, 
        status="Aberto", 
        data_abertura=datetime.utcnow()
    )
    db.add(db_caixa)
    db.commit()
    db.refresh(db_caixa)
    return db_caixa

@app.post("/caixa/fechar/{caixa_id}", response_model=schemas.CaixaOut)
def fechar_caixa(caixa_id: int, valor_final: float, db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    db_caixa = db.query(models.Caixa).filter(models.Caixa.id == caixa_id, models.Caixa.status == "Aberto").first()
    if not db_caixa:
        raise HTTPException(status_code=404, detail="Caixa não encontrado ou já fechado.")
    
    db_caixa.status = "Fechado"
    db_caixa.valor_final = valor_final
    db_caixa.data_fechamento = datetime.utcnow()
    db.commit()
    db.refresh(db_caixa)
    return db_caixa


# ==============================================================================
# CLIENTES E SESSÕES (Protegido)
# ==============================================================================

@app.post("/clientes/", response_model=schemas.ClienteOut)
def criar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    db_cliente = models.Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@app.get("/clientes/", response_model=List[schemas.ClienteOut])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    return db.query(models.Cliente).offset(skip).limit(limit).all()

@app.get("/sessoes/", response_model=List[schemas.SessaoOut])
def listar_sessoes_ativas(db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    return db.query(models.Sessao).filter(models.Sessao.status == "Ativo").all()

@app.post("/sessoes/iniciar", response_model=schemas.SessaoOut)
def iniciar_sessao(sessao: schemas.SessaoCreate, db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == sessao.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    
    db_sessao = models.Sessao(**sessao.dict(), status="Ativo", horario_inicio=datetime.utcnow())
    db.add(db_sessao)
    db.commit()
    db.refresh(db_sessao)
    return db_sessao

@app.post("/sessoes/finalizar/{sessao_id}", response_model=schemas.SessaoOut)
def finalizar_sessao(sessao_id: int, pagamento: schemas.SessaoFinalizar, db: Session = Depends(get_db), user: models.Usuario = Depends(get_current_user)):
    db_sessao = db.query(models.Sessao).filter(models.Sessao.id == sessao_id).first()
    if not db_sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")
    if db_sessao.status == "Finalizado":
        raise HTTPException(status_code=400, detail="Esta sessão já foi finalizada.")
    
    db_sessao.status = "Finalizado"
    db_sessao.valor_pago = pagamento.valor_pago
    db_sessao.forma_pagamento = pagamento.forma_pagamento
    db.commit()
    db.refresh(db_sessao)
    return db_sessao
