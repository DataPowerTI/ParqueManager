from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Login
res_auth = client.post("/token", data={"username": "admin", "password": "admin123"})
token = res_auth.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Auth:", res_auth.status_code)

# Preços
res = client.post("/precos", json={"minutos": 10, "valor": 15.0, "ativo": 1}, headers=headers)
print("Precos:", res.status_code, res.text)

# Teste Sessoes
res3 = client.get("/sessoes/", headers=headers)
print("Sessoes:", res3.status_code)
if res3.status_code != 200:
    print(res3.text)
