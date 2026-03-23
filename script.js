const LOGIN_ENDPOINT = "https://default5fe263d140174ff88b763ccd84ecfb.05.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3dcc0247fc4c4e54a773f34093a5d935/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=x3o1vCT9G49sAYfvOv8zs-XMNIBSg13bxEIcLDT-aR8";
const REPORT_ENDPOINT = "https://default5fe263d140174ff88b763ccd84ecfb.05.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ed14b861f49443da8955bd85cf9484bb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dZ-pw3pytaJtm7BXbEQE3QhuNClJcHliQabwxghptmU";

const loginForm = document.getElementById("loginForm");
const reportForm = document.getElementById("reportForm");
const pageShell = document.querySelector(".page-shell");

const loginCard = document.getElementById("loginCard");
const reportCard = document.getElementById("reportCard");

const loginButton = document.getElementById("loginButton");
const reportButton = document.getElementById("reportButton");

const loginFeedback = document.getElementById("loginFeedback");
const reportOutput = document.getElementById("reportOutput");
const reportPreview = document.getElementById("reportPreview");
const reportStatus = document.getElementById("reportStatus");
const downloadPdfButton = document.getElementById("downloadPdfButton");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const startDateLabel = document.getElementById("startDateLabel");
const endDateLabel = document.getElementById("endDateLabel");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

let lastReportContent = "";
let lastReportFileName = "relatorio-federal-energia";
let lastReportIsHtml = false;

function toggleOverlay(isVisible, message = "Processando...") {
  loadingOverlay.classList.toggle("hidden", !isVisible);
  loadingText.textContent = message;
}

function toggleButtonLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);
}

function setFeedback(element, message, state = "") {
  element.textContent = message;
  element.className = `feedback ${state}`.trim();
}

function formatJsonOutput(data) {
  if (typeof data === "string") {
    return data;
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "Retorno recebido, mas nao foi possivel formatar o conteudo.";
  }
}

function tryParseJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractAutomationResponse(data) {
  const parsedData = tryParseJson(data);

  if (typeof parsedData === "string") {
    return parsedData;
  }

  if (!parsedData || typeof parsedData !== "object") {
    return parsedData;
  }

  const preferredKeys = ["body", "result", "output", "response", "message", "data"];

  for (const key of preferredKeys) {
    if (key in parsedData) {
      const extracted = tryParseJson(parsedData[key]);
      return extractAutomationResponse(extracted);
    }
  }

  return parsedData;
}

function formatDateToBr(isoDate) {
  if (!isoDate || !isoDate.includes("-")) {
    return "";
  }

  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function updateDateVisual(inputElement, labelElement, baseLabel) {
  const formattedDate = formatDateToBr(inputElement.value);
  labelElement.textContent = formattedDate
    ? `${baseLabel}: ${formattedDate}`
    : baseLabel;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setPdfAvailability(content) {
  lastReportContent = content || "";
  lastReportIsHtml = false;
  lastReportFileName = "relatorio-federal-energia";
  downloadPdfButton.disabled = !lastReportContent;
}

function setPdfAvailabilityAdvanced(content, fileName, isHtml) {
  lastReportContent = content || "";
  lastReportFileName = fileName || "relatorio-federal-energia";
  lastReportIsHtml = Boolean(isHtml);
  downloadPdfButton.disabled = !lastReportContent;
}

function showTextResult(text) {
  reportOutput.classList.remove("hidden");
  reportPreview.classList.add("hidden");
  reportOutput.value = text;
}

function showHtmlResult(htmlContent) {
  reportOutput.classList.add("hidden");
  reportPreview.classList.remove("hidden");
  reportPreview.srcdoc = htmlContent;
}

function applyReportStyleOverrides(htmlContent) {
  const overrideStyle = `
    <style>
      .header h1 {
        font-size: 1.45rem !important;
        line-height: 1.2 !important;
        word-break: break-word;
      }
    </style>
  `;

  if (/<\/head>/i.test(htmlContent)) {
    return htmlContent.replace(/<\/head>/i, `${overrideStyle}</head>`);
  }

  return `${overrideStyle}${htmlContent}`;
}

function downloadReportAsPdf() {
  if (!lastReportContent) {
    return;
  }

  const printableWindow = window.open("", "_blank", "width=900,height=700");

  if (!printableWindow) {
    reportStatus.textContent = "Popup bloqueado";
    reportOutput.value = "Permita popups do navegador para gerar o PDF.";
    return;
  }

  const printableContent = lastReportIsHtml
    ? lastReportContent
    : `<pre>${escapeHtml(lastReportContent)}</pre>`;

  printableWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(lastReportFileName)}</title>
      <style>
        @page {
          margin: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 32px;
          font-family: Arial, sans-serif;
          color: #153761;
          background: #ffffff;
        }
        pre {
          white-space: pre-wrap;
          word-break: break-word;
          padding: 20px;
          border: 1px solid #d7e2f0;
          border-radius: 12px;
          background: #f7faff;
          font-size: 12px;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      ${printableContent}
      <script>
        window.onload = function () {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printableWindow.document.close();
}



async function postToPowerAutomate(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let parsedBody = rawText;

  try {
    parsedBody = rawText ? JSON.parse(rawText) : { message: "Fluxo executado sem corpo de resposta." };
  } catch {
    parsedBody = rawText || { message: "Fluxo executado sem corpo de resposta." };
  }

  if (!response.ok) {
    const errorMessage = typeof parsedBody === "string"
      ? parsedBody
      : parsedBody.message || "A automacao retornou erro.";

    throw new Error(errorMessage);
  }

  return parsedBody;
}

startDateInput.addEventListener("change", () => {
  updateDateVisual(startDateInput, startDateLabel, "Data inicio");
});

endDateInput.addEventListener("change", () => {
  updateDateVisual(endDateInput, endDateLabel, "Data fim");
});



updateDateVisual(startDateInput, startDateLabel, "Data inicio");
updateDateVisual(endDateInput, endDateLabel, "Data fim");
setPdfAvailability("");

downloadPdfButton.addEventListener("click", downloadReportAsPdf);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!LOGIN_ENDPOINT) {
    setFeedback(loginFeedback, "Defina a URL de login no arquivo script.js.", "error");
    return;
  }

  setFeedback(loginFeedback, "");
  toggleButtonLoading(loginButton, true);
  toggleOverlay(true, "Validando acesso...");

  try {
    const response = await postToPowerAutomate(LOGIN_ENDPOINT, {
      email,
      senha: password
    });

    setFeedback(
      loginFeedback,
      response.message || "Login enviado com sucesso. O formulario de relatorio foi liberado.",
      "success"
    );

    loginCard.classList.add("hidden");
    reportCard.classList.remove("hidden");
    pageShell.classList.add("report-mode");
    reportCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setFeedback(loginFeedback, error.message || "Nao foi possivel iniciar o fluxo de login.", "error");
  } finally {
    toggleButtonLoading(loginButton, false);
    toggleOverlay(false);
  }
});

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const startDate = startDateInput.value.trim();
  const endDate = endDateInput.value.trim();
  const filial = document.getElementById("filial").value.trim();
  const agencia = document.getElementById("agencia").value.trim();
  const conta = document.getElementById("conta").value.trim();
  const bank = document.getElementById("bank").value.trim();
  const formattedStartDate = formatDateToBr(startDate);
  const formattedEndDate = formatDateToBr(endDate);

  if (!formattedStartDate || !formattedEndDate) {
    reportStatus.textContent = "Data invalida";
    showTextResult("Selecione as duas datas no calendario.");
    setPdfAvailability("");
    return;
  }

  if (endDate < startDate) {
    reportStatus.textContent = "Periodo invalido";
    showTextResult("A data fim precisa ser maior ou igual a data inicio.");
    setPdfAvailability("");
    return;
  }

  if (!filial || !agencia || !conta || !bank) {
    reportStatus.textContent = "Parametros invalidos";
    showTextResult("Preencha banco, filial, agencia e conta.");
    setPdfAvailability("");
    return;
  }

  if (!REPORT_ENDPOINT) {
    reportStatus.textContent = "URL nao definida";
    showTextResult("Defina a URL do relatorio no arquivo script.js.");
    setPdfAvailability("");
    return;
  }

  toggleButtonLoading(reportButton, true);
  toggleOverlay(true, "Gerando relatorio...");
  reportStatus.textContent = "Processando";
  showTextResult("Aguardando retorno da automacao...");

  try {
    const response = await postToPowerAutomate(REPORT_ENDPOINT, {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      startDateIso: startDate,
      endDateIso: endDate,
      bank,
      filial,
      agencia,
      conta
    });
    const automationResponse = extractAutomationResponse(response);

    if (
      automationResponse &&
      typeof automationResponse === "object" &&
      "relatorio" in automationResponse
    ) {
      const reportHtml = String(automationResponse.relatorio || "");
      const reportFileName = String(automationResponse.nomeArquivo || "relatorio-federal-energia");

      if (reportHtml.trim()) {
        const adjustedReportHtml = applyReportStyleOverrides(reportHtml);
        showHtmlResult(adjustedReportHtml);
        setPdfAvailabilityAdvanced(adjustedReportHtml, reportFileName, true);
      } else {
        showTextResult("O campo relatorio veio vazio.");
        setPdfAvailability("");
      }
    } else {
      const formattedResponse = formatJsonOutput(automationResponse);
      showTextResult(formattedResponse);
      setPdfAvailabilityAdvanced(formattedResponse, "relatorio-federal-energia", false);
    }

    reportStatus.textContent = "Concluido";
  } catch (error) {
    reportStatus.textContent = "Falha";
    showTextResult(error.message || "Nao foi possivel gerar o relatorio.");
    setPdfAvailability("");
  } finally {
    toggleButtonLoading(reportButton, false);
    toggleOverlay(false);
  }
});