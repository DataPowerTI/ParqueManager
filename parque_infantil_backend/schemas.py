from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# Base Config for Pydantic V2/V1 compatibility
class ORMConfig:
    from_attributes = True
    orm_mode = True

# --- Caixa ---
class CaixaBase(BaseModel):
    valor_inicial: float

class CaixaCreate(CaixaBase):
    pass

class CaixaOut(CaixaBase):
    id: int
    status: str
    valor_final: Optional[float] = None
    data_abertura: datetime
    data_fechamento: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Cliente ---
class ClienteBase(BaseModel):
    nome_crianca: str
    nome_responsavel: str
    contato_responsavel: str

class ClienteCreate(ClienteBase):
    pass

class ClienteOut(ClienteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Sessao ---
class SessaoBase(BaseModel):
    cliente_id: int
    tempo_contratado: int

class SessaoCreate(SessaoBase):
    pass

class SessaoOut(SessaoBase):
    id: int
    horario_inicio: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)

# --- Autenticação e Usuários ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UsuarioBase(BaseModel):
    username: str
    role: str = "usuario"

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioOut(UsuarioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Configurações ---
class ConfiguracaoBase(BaseModel):
    nome_empresa: str
    cnpj: Optional[str] = None

class ConfiguracaoOut(ConfiguracaoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Relatórios ---
class RelatorioCaixaMensal(BaseModel):
    faturamento_total: float
    total_criancas: int
    mes_ano: str
