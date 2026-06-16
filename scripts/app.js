const APP_VERSION = "2.0.0-minimal-update";
const DRAFT_KEY = "eth-pv-planner-aufnahme-draft-v4";
const RECORDS_KEY = "eth-pv-planner-aufnahme-records-v4";

const form = document.getElementById("pvForm");
const preview = document.getElementById("preview");
const exportButton = document.getElementById("exportButton");
const newButton = document.getElementById("newButton");
const saveStatus = document.getElementById("saveStatus");
const onlineStatus = document.getElementById("onlineStatus");
const aufnahmeIdField = document.getElementById("aufnahmeId");
const summaryId = document.getElementById("summaryId");
const summaryCustomer = document.getElementById("summaryCustomer");
const summaryReady = document.getElementById("summaryReady");
const workflowStatusField = document.getElementById("workflowStatus");
const workflowVerlaufField = document.getElementById("workflowVerlauf");
const netzbetreiberSelect = document.getElementById("netzbetreiber");
const netzbetreiberAndereField = document.getElementById("netzbetreiberAndere");
const netzbetreiberAndereLabel = document.getElementById("netzbetreiberAndereLabel");
const gpsButton = document.getElementById("gpsButton");
const gpsStatus = document.getElementById("gpsStatus");

function pad(value) {
  return String(value).padStart(2, "0");
}

function localTimestamp(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function isoTimestamp(date = new Date()) {
  return date.toISOString();
}

function fileTimestamp(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function createAufnahmeId() {
  return `PV-${fileTimestamp()}`;
}

function updateOnlineStatus() {
  onlineStatus.textContent = navigator.onLine ? "Online" : "Offline";
}

function getCheckedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
}

function value(name) {
  const v = new FormData(form).get(name);
  return typeof v === "string" ? v.trim() : (v || "");
}

function setFieldValue(name, nextValue) {
  const field = form.elements[name];
  if (field) {
    field.value = nextValue ?? "";
  }
}

function isAddressFilled() {
  return ["strasse", "hausnummer", "plz", "ort"].some(name => value(name));
}

function currentAddressString() {
  return [value("strasse"), value("hausnummer"), value("plz"), value("ort")].filter(Boolean).join(", ");
}

function readRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function collectData() {
  const fd = new FormData(form);
  const aufnahmeId = fd.get("aufnahmeId") || createAufnahmeId();
  const gpsLat = value("gpsLat");
  const gpsLon = value("gpsLon");
  const gpsAccuracy = value("gpsAccuracy");
  const gpsTimestamp = value("gpsTimestamp");
  const gpsReverseProvider = value("gpsReverseProvider");
  const gpsReverseStatus = value("gpsReverseStatus");

  const objekt = {
    strasse: value("strasse"),
    hausnummer: value("hausnummer"),
    plz: value("plz"),
    ort: value("ort"),
    hinweise: value("objektHinweise"),
    netzbetreiber: fd.get("netzbetreiber") || "",
    netzbetreiberAndere: value("netzbetreiberAndere")
  };

  if (gpsLat) {
    objekt.gps = {
      lat: Number(gpsLat),
      lon: Number(gpsLon),
      accuracyM: gpsAccuracy ? Number(gpsAccuracy) : undefined,
      erfasstAmIso: gpsTimestamp || "",
      reverseGeocodingProvider: gpsReverseProvider || "",
      reverseGeocodingStatus: gpsReverseStatus || ""
    };
  }

  return {
    schema: {
      name: "eth-pv-aufnahme",
      version: "2.0.0"
    },
    meta: {
      aufnahmeId,
      erstelltAmLokaleZeit: localTimestamp(),
      erstelltAmIso: isoTimestamp(),
      appName: "ETH PV Planner - Aufnahmeformular",
      appVersion: APP_VERSION,
      exportFormat: "json",
      quelle: "pv-aufnahme-pwa minimal update"
    },
    kunde: {
      kundenname: value("kundenname"),
      telefon: value("telefon"),
      email: value("email"),
      bearbeiter: value("bearbeiter")
    },
    objekt,
    dach: {
      dachaufbau: fd.get("dachaufbau") || "",
      dachzustand: fd.get("dachzustand") || "",
      dachneigungGrad: value("dachneigung"),
      ausrichtung: fd.get("ausrichtung") || "",
      einbindungBlitzschutz: fd.get("einbindungBlitzschutz") || "",
      ziegeltyp: value("ziegeltyp"),
      kabelwegDc: fd.get("kabelwegDc") || "",
      kernbohrung: fd.get("kernbohrung") || "",
      weitereInfos: value("weitereInfosDach")
    },
    elektro: {
      zaehlerschrankGeeignet: fd.get("zaehlerschrankGeeignet") || "",
      potentialausgleichErdung: fd.get("potentialausgleichErdung") || "",
      hauptsicherung: fd.get("hauptsicherung") || "",
      leitungswegAc: value("leitungswegAc"),
      weitereInfos: value("weitereInfosElektro")
    },
    anlage: {
      kwpWunsch: value("kwpWunsch"),
      speicherGewuenscht: fd.get("speicherGewuenscht") || "",
      wallboxGewuenscht: fd.get("wallboxGewuenscht") || "",
      notstrom: fd.get("notstrom") || "",
      waermepumpe: fd.get("waermepumpe") || "",
      jahresverbrauchKwh: value("jahresverbrauch"),
      weitereInfos: value("weitereInfosAnlage")
    },
    sonstiges: {
      todo: getCheckedValues("todo"),
      montagezeitraum: value("montagezeitraum"),
      angebotsreife: fd.get("angebotsreife") || "",
      notizen: value("notizen")
    },
    workflow: {
      status: fd.get("workflowStatus") || "",
      kommentar: value("workflowKommentar")
    }
  };
}

function fillFormFromData(data) {
  if (!data) return;

  form.reset();

  const flat = {
    aufnahmeId: data.meta?.aufnahmeId,
    bearbeiter: data.kunde?.bearbeiter,
    kundenname: data.kunde?.kundenname,
    telefon: data.kunde?.telefon,
    email: data.kunde?.email,
    strasse: data.objekt?.strasse,
    hausnummer: data.objekt?.hausnummer,
    plz: data.objekt?.plz,
    ort: data.objekt?.ort,
    objektHinweise: data.objekt?.hinweise,
    dachaufbau: data.dach?.dachaufbau,
    dachzustand: data.dach?.dachzustand,
    dachneigung: data.dach?.dachneigungGrad,
    ausrichtung: data.dach?.ausrichtung,
    einbindungBlitzschutz: data.dach?.einbindungBlitzschutz,
    ziegeltyp: data.dach?.ziegeltyp,
    kabelwegDc: data.dach?.kabelwegDc,
    kernbohrung: data.dach?.kernbohrung,
    weitereInfosDach: data.dach?.weitereInfos,
    zaehlerschrankGeeignet: data.elektro?.zaehlerschrankGeeignet,
    potentialausgleichErdung: data.elektro?.potentialausgleichErdung,
    hauptsicherung: data.elektro?.hauptsicherung,
    leitungswegAc: data.elektro?.leitungswegAc,
    weitereInfosElektro: data.elektro?.weitereInfos,
    kwpWunsch: data.anlage?.kwpWunsch,
    speicherGewuenscht: data.anlage?.speicherGewuenscht,
    wallboxGewuenscht: data.anlage?.wallboxGewuenscht,
    notstrom: data.anlage?.notstrom,
    waermepumpe: data.anlage?.waermepumpe,
    jahresverbrauch: data.anlage?.jahresverbrauchKwh,
    weitereInfosAnlage: data.anlage?.weitereInfos,
    montagezeitraum: data.sonstiges?.montagezeitraum,
    angebotsreife: data.sonstiges?.angebotsreife,
    notizen: data.sonstiges?.notizen,
    workflowKommentar: data.workflow?.kommentar
  };

  for (const [name, fieldValue] of Object.entries(flat)) {
    if (fieldValue !== undefined && fieldValue !== null) {
      setFieldValue(name, fieldValue);
    }
  }

  form.querySelectorAll('input[name="todo"]').forEach(input => {
    input.checked = Boolean(data.sonstiges?.todo?.includes(input.value));
  });

  if (data.workflow?.status && workflowStatusField) {
    workflowStatusField.value = data.workflow.status;
  }

  if (data.objekt) {
    const raw = data.objekt.netzbetreiber || "";
    const otherVal = data.objekt.netzbetreiberAndere || "";
    let valueToSet = "";
    let other = "";

    if (/stadtwerke\s*erding/i.test(raw)) {
      valueToSet = "Stadtwerke Erding";
    } else if (/bayernwerk|bayernwerke/i.test(raw)) {
      valueToSet = "Bayernwerk";
    } else if (raw) {
      valueToSet = "Andere";
      other = raw;
    }

    if (otherVal) {
      valueToSet = "Andere";
      other = otherVal;
    }

    netzbetreiberSelect.value = valueToSet;

    if (valueToSet === "Andere") {
      netzbetreiberAndereField.style.display = "";
      netzbetreiberAndereLabel.style.display = "";
      netzbetreiberAndereField.value = other;
    } else {
      netzbetreiberAndereField.style.display = "none";
      netzbetreiberAndereLabel.style.display = "none";
      netzbetreiberAndereField.value = "";
    }
  }

  if (data.objekt?.gps) {
    const gps = data.objekt.gps;
    setFieldValue("gpsLat", gps.lat);
    setFieldValue("gpsLon", gps.lon);
    setFieldValue("gpsAccuracy", gps.accuracyM);
    setFieldValue("gpsTimestamp", gps.erfasstAmIso);
    setFieldValue("gpsReverseProvider", gps.reverseGeocodingProvider);
    setFieldValue("gpsReverseStatus", gps.reverseGeocodingStatus);
  }

  if (workflowVerlaufField) {
    workflowVerlaufField.value = data.meta?.aufnahmeId || "";
  }
}

function buildRecordLabel(record) {
  const aufnahmeId = record.meta?.aufnahmeId || "Ohne ID";
  const kundenname = record.kunde?.kundenname || "Ohne Kundenname";
  const ort = record.objekt?.ort || "Ohne Ort";
  const zeit = record.meta?.erstelltAmLokaleZeit || record.meta?.erstelltAmIso || "";
  return [aufnahmeId, kundenname, ort, zeit].filter(Boolean).join(" | ");
}

function renderHistoryOptions(selectedId = "") {
  if (!workflowVerlaufField) return;

  const records = readRecords()
    .slice()
    .sort((a, b) => (b.meta?.erstelltAmIso || "").localeCompare(a.meta?.erstelltAmIso || ""));

  workflowVerlaufField.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Lokales Projekt auswaehlen";
  workflowVerlaufField.appendChild(placeholder);

  records.forEach(record => {
    const option = document.createElement("option");
    option.value = record.meta?.aufnahmeId || "";
    option.textContent = buildRecordLabel(record);
    workflowVerlaufField.appendChild(option);
  });

  workflowVerlaufField.value = selectedId && records.some(record => record.meta?.aufnahmeId === selectedId) ? selectedId : "";
}

function updatePreview() {
  const data = collectData();
  preview.textContent = JSON.stringify(data, null, 2);
  if (summaryId) summaryId.textContent = data.meta.aufnahmeId || "-";
  if (summaryCustomer) summaryCustomer.textContent = data.kunde.kundenname || "-";
  if (summaryReady) summaryReady.textContent = data.sonstiges.angebotsreife || "-";
}

function saveDraft() {
  const data = collectData();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  saveStatus.textContent = `Entwurf lokal gespeichert: ${localTimestamp()}`;
  updatePreview();
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);

  if (!raw) {
    form.reset();
    aufnahmeIdField.value = createAufnahmeId();
    renderHistoryOptions();
    updatePreview();
    return;
  }

  try {
    fillFormFromData(JSON.parse(raw));
    if (!aufnahmeIdField.value) aufnahmeIdField.value = createAufnahmeId();
    renderHistoryOptions(aufnahmeIdField.value);
    updatePreview();
    saveStatus.textContent = "Lokaler Entwurf geladen.";
  } catch (error) {
    console.error(error);
    form.reset();
    aufnahmeIdField.value = createAufnahmeId();
    renderHistoryOptions();
    updatePreview();
  }
}

function storeRecord(data) {
  const records = readRecords();
  records.push(data);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJsonRecord() {
  if (!form.reportValidity()) return;

  const data = collectData();
  storeRecord(data);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));

  const baseName = `${data.meta.aufnahmeId}-${fileTimestamp()}`;
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });

  downloadBlob(`${baseName}.json`, jsonBlob);
  renderHistoryOptions(data.meta.aufnahmeId);
  saveStatus.textContent = `JSON-Datensatz erzeugt: ${localTimestamp()}`;
  updatePreview();
}

function resetForm() {
  if (!confirm("Neue Aufnahme starten? Der aktuelle Entwurf bleibt nur erhalten, wenn er vorher als JSON exportiert wurde.")) return;
  form.reset();
  aufnahmeIdField.value = createAufnahmeId();
  localStorage.removeItem(DRAFT_KEY);
  renderHistoryOptions();
  saveStatus.textContent = "Neue Aufnahme gestartet.";
  updatePreview();
}

function loadRecordFromHistory(aufnahmeId) {
  if (!aufnahmeId) return;

  const record = readRecords().find(entry => entry.meta?.aufnahmeId === aufnahmeId);
  if (!record) {
    workflowVerlaufField.value = "";
    return;
  }

  const currentId = value("aufnahmeId");
  if (currentId && !confirm("Ausgewaehlten Verlauf laden und aktuellen Entwurf ueberschreiben?")) {
    workflowVerlaufField.value = currentId;
    return;
  }

  fillFormFromData(record);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(record));
  saveStatus.textContent = `Verlauf geladen: ${record.meta?.aufnahmeId || ""}`;
  updatePreview();
}

function updateNetzbetreiberVisibility() {
  if (!netzbetreiberSelect) return;

  if (netzbetreiberSelect.value === "Andere") {
    netzbetreiberAndereField.style.display = "";
    netzbetreiberAndereLabel.style.display = "";
  } else {
    netzbetreiberAndereField.style.display = "none";
    netzbetreiberAndereLabel.style.display = "none";
    netzbetreiberAndereField.value = "";
  }
}

async function reverseGeocode(lat, lon) {
  const provider = "nominatim openstreetmap";
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=jsonv2`);
    if (!resp.ok) {
      return { status: `HTTP ${resp.status}`, provider };
    }

    const data = await resp.json();
    const address = data.address || {};
    const road = address.road || "";
    const houseNumber = address.house_number || "";
    const postcode = address.postcode || "";
    const city = address.city || address.town || address.village || address.hamlet || address.municipality || "";

    return {
      provider,
      status: "ok",
      fields: {
        strasse: road,
        hausnummer: houseNumber,
        plz: postcode,
        ort: city
      }
    };
  } catch (error) {
    console.error(error);
    return { status: "fetch-error", provider };
  }
}

if (form) {
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);
}

if (exportButton) {
  exportButton.addEventListener("click", exportJsonRecord);
}

if (newButton) {
  newButton.addEventListener("click", resetForm);
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => console.error("Service worker registration failed", error));
  });
}

if (netzbetreiberSelect) {
  netzbetreiberSelect.addEventListener("change", () => {
    updateNetzbetreiberVisibility();
  });
}

if (workflowVerlaufField) {
  workflowVerlaufField.addEventListener("change", event => {
    loadRecordFromHistory(event.target.value);
  });
}

if (gpsButton) {
  gpsButton.addEventListener("click", async () => {
    if (!navigator.geolocation) {
      gpsStatus.textContent = "Geolokalisierung wird nicht unterstuetzt.";
      return;
    }

    gpsStatus.textContent = "Standort wird ermittelt...";
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      setFieldValue("gpsLat", latitude);
      setFieldValue("gpsLon", longitude);
      setFieldValue("gpsAccuracy", accuracy != null ? accuracy.toString() : "");
      setFieldValue("gpsTimestamp", isoTimestamp());

      let reverse = { status: "offline", provider: "" };
      if (navigator.onLine) {
        reverse = await reverseGeocode(latitude, longitude);
      }

      setFieldValue("gpsReverseProvider", reverse.provider || "");
      setFieldValue("gpsReverseStatus", reverse.status || "");

      if (reverse.fields) {
        const shouldOverwrite = !isAddressFilled() || confirm(`Adressfelder ueberschreiben?\n${currentAddressString() || "Keine bestehende Adresse"}`);
        if (shouldOverwrite) {
          Object.entries(reverse.fields).forEach(([name, fieldValue]) => {
            setFieldValue(name, fieldValue || "");
          });
        }
        gpsStatus.textContent = "Adresse verarbeitet.";
      } else {
        gpsStatus.textContent = "Koordinaten gespeichert, aber Adresse konnte nicht ermittelt werden.";
      }

      saveDraft();
    }, error => {
      console.error(error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          gpsStatus.textContent = "Zugriff auf Standort verweigert.";
          break;
        case error.POSITION_UNAVAILABLE:
          gpsStatus.textContent = "Position nicht verfuegbar.";
          break;
        case error.TIMEOUT:
          gpsStatus.textContent = "Zeitueberschreitung bei der Standortbestimmung.";
          break;
        default:
          gpsStatus.textContent = "Unbekannter Fehler bei der Standortbestimmung.";
      }
    }, { enableHighAccuracy: true, timeout: 10000 });
  });
}

updateOnlineStatus();
updateNetzbetreiberVisibility();
renderHistoryOptions();
loadDraft();
