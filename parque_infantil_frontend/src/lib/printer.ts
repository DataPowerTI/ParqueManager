export interface DadosComprovante {
  empresa: string;
  cnpj?: string;
  operador: string;
  cliente: {
    nome_crianca: string;
    nome_responsavel: string;
  };
  sessao: {
    tempo_contratado: number;
    horario_inicio: string;
  };
  valor: number;
  formaPagamento: string;
}

export const imprimirComprovante = (dados: DadosComprovante) => {
  const { empresa, cnpj, cliente, sessao, valor, formaPagamento, operador } = dados;
  const dataAtual = new Date().toLocaleString('pt-BR');

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante de Pagamento</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            width: 250px; /* Ideal para impressoras térmicas 58mm */
            margin: 0 auto;
            padding: 10px 5px;
            color: #000;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .flex-between { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="text-center font-bold mb-2" style="font-size: 14px;">
          ${empresa}
        </div>
        ${cnpj ? `<div class="text-center mb-2">CNPJ: ${cnpj}</div>` : ''}
        <div class="text-center mb-2 font-bold">
          COMPROVANTE DE PAGAMENTO
        </div>
        
        <div class="divider"></div>
        
        <div class="mb-1"><strong>Data:</strong> ${dataAtual}</div>
        <div class="mb-1"><strong>Operador:</strong> ${operador}</div>
        
        <div class="divider"></div>
        
        <div class="mb-1"><strong>Criança:</strong> ${cliente.nome_crianca}</div>
        <div class="mb-1"><strong>Resp.:</strong> ${cliente.nome_responsavel}</div>
        <div class="mb-1"><strong>Tempo:</strong> ${sessao.tempo_contratado} min</div>
        
        <div class="divider"></div>
        
        <div class="flex-between font-bold" style="font-size: 14px;">
          <span>TOTAL PAGO</span>
          <span>R$ ${valor.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="flex-between mt-1">
          <span>Forma:</span>
          <span>${formaPagamento}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="text-center mt-2">
          Obrigado pela preferência!<br>
          Volte sempre.<br><br>
          <span style="font-size: 10px;">Desenvolvido por Data Power Labs</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  // Tenta abrir numa nova janela para evitar problemas com bloqueadores de iframe em alguns navegadores
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  } else {
    // Fallback: Se o popup for bloqueado, usamos o iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    if (iframe.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(content);
      iframe.contentDocument.close();
    }
    
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
};
