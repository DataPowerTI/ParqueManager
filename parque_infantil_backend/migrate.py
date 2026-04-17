import sqlite3

def migrate():
    conn = sqlite3.connect('parque.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE sessoes ADD COLUMN valor_pago FLOAT NULL")
        cursor.execute("ALTER TABLE sessoes ADD COLUMN forma_pagamento VARCHAR NULL")
        print("Tabela sessoes alterada.")
    except Exception as e:
        print("INFO Sessoes:", e)

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tabelas_preco (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                minutos INTEGER,
                valor FLOAT,
                ativo INTEGER DEFAULT 1
            )
        """)
        # Seed initial prices
        cursor.execute("SELECT count(*) FROM tabelas_preco")
        count = cursor.fetchone()[0]
        if count == 0:
            cursor.execute("INSERT INTO tabelas_preco (minutos, valor) VALUES (15, 20.0), (30, 35.0), (60, 50.0), (120, 80.0)")
            print("Preços base inseridos.")
    except Exception as e:
        print("INFO Tabelas:", e)
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == '__main__':
    migrate()
