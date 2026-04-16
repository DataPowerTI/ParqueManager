from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Caixa(Base):
    __tablename__ = "caixas"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="Aberto") # Aberto ou Fechado
    valor_inicial = Column(Float, default=0.0)
    valor_final = Column(Float, nullable=True)
    data_abertura = Column(DateTime, default=datetime.utcnow)
    data_fechamento = Column(DateTime, nullable=True)

class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(Integer, primary_key=True, index=True)
    nome_crianca = Column(String, index=True)
    nome_responsavel = Column(String)
    contato_responsavel = Column(String) # CPF/Telefone
    
    sessoes = relationship("Sessao", back_populates="cliente")

class Sessao(Base):
    __tablename__ = "sessoes"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    horario_inicio = Column(DateTime, default=datetime.utcnow)
    tempo_contratado = Column(Integer) # em minutos
    status = Column(String, default="Ativo") # Ativo ou Finalizado
    
    cliente = relationship("Cliente", back_populates="sessoes")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="usuario") # "adm" or "usuario"

class Configuracao(Base):
    __tablename__ = "configuracoes"

    id = Column(Integer, primary_key=True, index=True)
    nome_empresa = Column(String, default="Parque Manager")
    cnpj = Column(String, nullable=True)
