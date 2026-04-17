import requests

r_auth = requests.post('http://127.0.0.1:8000/token', data={'username':'admin', 'password':'admin123'})
token = r_auth.json().get('access_token')

if not token:
    print("Erro login:", r_auth.text)
else:
    headers = {'Authorization': f'Bearer {token}'}
    
    # Teste Precos
    res_preco = requests.post('http://127.0.0.1:8000/precos', json={'minutos': 10, 'valor': 15.0, 'ativo': 1}, headers=headers)
    print("Preços POST:", res_preco.status_code, res_preco.text)
    
    # Teste Caixa Abrir
    res_caixa = requests.post('http://127.0.0.1:8000/caixa/abrir', json={'valor_inicial': 0.0}, headers=headers)
    print("Caixa POST Abrir:", res_caixa.status_code, res_caixa.text)
    
    # Teste Caixa Status
    res_caixa = requests.get('http://127.0.0.1:8000/caixa/status', headers=headers)
    print("Caixa GET Status:", res_caixa.status_code, res_caixa.text)
