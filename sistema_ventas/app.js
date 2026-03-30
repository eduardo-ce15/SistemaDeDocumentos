function cargarTipos() {
    const categoria = document.getElementById("categoria").value;
    const tipo = document.getElementById("tipo");

    // limpiar opciones
    tipo.innerHTML = '<option value="" disabled selected>TIPO DE DOCUMENTO</option>';

    let opciones = [];

    if (categoria === "laboral") {
        opciones = [
            "CARTA DE RENUNCIA",
            "SOLICITUD DE LIQUIDACION",
            "SOLICITUD DE VACACIONES",
            "SOLICITUD DE PERMISO",
            "SOLICITUD DE CERTIFICADO DE TRABAJO"
        ];
    }

    if (categoria === "administrativo") {
        opciones = [
            "SOLICITUD SIMPLE",
            "CARTA DE RECLAMO",
            "SOLICITUD DE CONSTANCIA",
            "SOLICITUD DE DEVOLUCION DE DINERO",
            "DECLARACION JURADA SIMPLE"
        ];
    }

    if (categoria === "legal") {
        opciones = [
            "CARTA PODER SIMPLE",
            "COMPROMISO DE PAGO",
            "CARTA DE AUTORIZACION",
            "CONSTANCIA DE CONVIVENCIA"
        ];
    }

    if (categoria === "academico") {
        opciones = [
            "SOLICITUD DE MATRICULA",
            "SOLICITUD DE RETIRO",
            "JUSTIFICACION DE INASISTENCIA",
            "SOLICITUD DE BECA"
        ];
    }

    // agregar opciones al select
    opciones.forEach(op => {
        const option = document.createElement("option");
        option.value = op;
        option.textContent = op;
        tipo.appendChild(option);
    });
}

const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");

let dibujando = false;
let puntos = [];

function ajustarCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener("load", ajustarCanvas);
window.addEventListener("resize", ajustarCanvas);

// 🧠 obtener posición
function getPos(e) {
    const rect = canvas.getBoundingClientRect();

    if (e.touches) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    } else {
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

// 🟢 iniciar dibujo
function iniciar(e) {
    dibujando = true;
    puntos = [];
    puntos.push(getPos(e));
}

// 🔴 terminar
function terminar() {
    ctx.strokeStyle = "#0b1e3c";
    dibujando = false;
    ctx.beginPath();
}

// ✍️ dibujar suave
function dibujar(e) {
    if (!dibujando) return;

    const punto = getPos(e);
    puntos.push(punto);

    if (puntos.length < 3) return;

    const p1 = puntos[puntos.length - 3];
    const p2 = puntos[puntos.length - 2];
    const p3 = puntos[puntos.length - 1];

    // punto medio
    const xc = (p2.x + p3.x) / 2;
    const yc = (p2.y + p3.y) / 2;

    // velocidad = distancia
    const dx = p3.x - p2.x;
    const dy = p3.y - p2.y;
    const velocidad = Math.sqrt(dx * dx + dy * dy);

    // grosor dinámico
    const grosor = Math.max(1, 4 - velocidad / 2);

    ctx.lineWidth = grosor;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(p2.x, p2.y, xc, yc);
    ctx.stroke();
}

// EVENTOS PC
canvas.addEventListener("mousedown", iniciar);
canvas.addEventListener("mouseup", terminar);
canvas.addEventListener("mousemove", dibujar);

// EVENTOS TOUCH 📱
canvas.addEventListener("touchstart", iniciar);
canvas.addEventListener("touchend", terminar);
canvas.addEventListener("touchmove", dibujar);

// LIMPIAR
function limpiarFirma() {

    Swal.fire({
        title: "¿Borrar firma?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#198754", // verde pro
        cancelButtonColor: "#dc3545",
        confirmButtonText: "Sí, borrar",
        cancelButtonText: "Cancelar"
    }).then((result) => {

        if (result.isConfirmed) {

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            Swal.fire({
                title: "Eliminado",
                text: "La firma fue borrada correctamente",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// convertir TODO a mayúsculas automáticamente
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
        input.value = input.value.toUpperCase();
    });
});

function generarPDF() {
    const { jsPDF } = window.jspdf;

    const nombre = document.getElementById("nombre").value;
    const dni = document.getElementById("dni").value;
    const asunto = document.getElementById("tipo").value;
    const remitente = document.getElementById("remitente").value;

    if (!nombre || !dni || !asunto || !remitente) {
        alert("Completa todos los campos");
        return;
    }

    const doc = new jsPDF();

    // 📅 FECHA FORMATO LARGO
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = fecha.toLocaleDateString("es-ES", { month: "long" });
    const anio = fecha.getFullYear();

    const fechaTexto = `Huancayo ${dia} de ${mes} del ${anio}`;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // FECHA
    doc.setFont("helvetica", "bold");
    doc.text(fechaTexto, 200, 20, { align: "right" });

    // PARA
    doc.text(`Para: ${remitente}`, 20, 40);

    // ASUNTO
    doc.text(`Asunto: ${asunto}`, 20, 48);

    doc.setFont("helvetica", "normal");

    // 📝 TEXTO REAL COMO IMAGEN
    const tipo = document.getElementById("tipo").value;
    const texto = obtenerTexto(tipo, nombre, dni);

    const textoDividido = doc.splitTextToSize(texto, 170);

    doc.text(textoDividido, 20, 65, {
        lineHeightFactor: 1.5
    });

    // 📍 POSICIÓN FINAL
    let alturaFinal = 65 + (textoDividido.length * 7);

    // ✍️ FIRMA (imagen)
    const canvas = document.getElementById("firma");
    const firmaImg = canvas.toDataURL("image/png");
    doc.addImage(firmaImg, "PNG", 75, alturaFinal + 10, 50, 20);

    // LÍNEA
    doc.line(60, alturaFinal + 40, 150, alturaFinal + 40);

    // NOMBRE
    doc.setFont("helvetica", "bold");
    doc.text(nombre, 105, alturaFinal + 48, { align: "center" });

    // DNI
    doc.text(`DNI: ${dni}`, 105, alturaFinal + 55, { align: "center" });

    // GUARDAR

    let historial = JSON.parse(localStorage.getItem("documentos")) || [];

    historial.push({
        nombre,
        dni,
        asunto,
        fecha: new Date().toLocaleString()
    });

    localStorage.setItem("documentos", JSON.stringify(historial));

    doc.save(`${asunto}_${dni}.pdf`);
}

function obtenerTexto(tipo, nombre, dni) {

    if (tipo === "CARTA DE RENUNCIA") {
        return `Me dirijo a usted para presentar mi renuncia voluntaria. Yo ${nombre}, identificado con DNI ${dni}, comunico mi decisión por motivos personales.

Agradezco la oportunidad brindada durante mi permanencia en la empresa.

Atentamente,`;
    }

    if (tipo === "SOLICITUD DE LIQUIDACION") {
        return `Yo ${nombre}, identificado con DNI ${dni}, solicito se me otorgue mi liquidación de beneficios sociales conforme a ley.

Agradeceré se realice el trámite correspondiente a la brevedad.

Atentamente,`;
    }

    if (tipo === "SOLICITUD DE VACACIONES") {
        return `Yo ${nombre}, identificado con DNI ${dni}, solicito hacer uso de mi periodo vacacional conforme a lo establecido.

Agradezco su atención.

Atentamente,`;
    }

    if (tipo === "SOLICITUD DE PERMISO") {
        return `Yo ${nombre}, identificado con DNI ${dni}, solicito permiso por motivos personales.

Agradezco su comprensión.

Atentamente,`;
    }

    if (tipo === "SOLICITUD DE CERTIFICADO DE TRABAJO") {
        return `Yo ${nombre}, identificado con DNI ${dni}, solicito la emisión de mi certificado de trabajo.

Agradezco su atención.

Atentamente,`;
    }

    if (tipo === "SOLICITUD SIMPLE") {
        return `Yo ${nombre}, identificado con DNI ${dni}, me dirijo a usted para presentar la siguiente solicitud.

Agradezco su atención.

Atentamente,`;
    }

    if (tipo === "CARTA DE RECLAMO") {
        return `Yo ${nombre}, identificado con DNI ${dni}, presento un reclamo por inconvenientes en el servicio recibido.

Solicito se tomen las medidas correspondientes.

Atentamente,`;
    }

    if (tipo === "DECLARACION JURADA SIMPLE") {
        return `Yo ${nombre}, identificado con DNI ${dni}, declaro bajo juramento que la información proporcionada es veraz.

Atentamente,`;
    }

    // fallback
    return `Yo ${nombre}, identificado con DNI ${dni}, presento el siguiente documento.

Atentamente,`;
}

function mostrarCamposExtra() {
    const tipo = document.getElementById("tipo").value;
    const contenedor = document.getElementById("camposExtra");

    contenedor.innerHTML = "";

    if (tipo === "CARTA DE RENUNCIA") {
        contenedor.innerHTML = `
            <input type="date" id="fechaRenuncia">
            <br><br>
            <select id="motivo">
                <option disabled selected>MOTIVO DE RENUNCIA</option>
                <option value="renuncia voluntaria">RENUNCIA VOLUNTARIA</option>
            </select>
        `;
    }

    if (tipo === "SOLICITUD DE PERMISO") {
        contenedor.innerHTML = `
            <input type="text" id="motivo" placeholder="Motivo del permiso">
            <br><br>
            <input type="date" id="fechaPermiso">
        `;
    }

    if (tipo === "SOLICITUD DE VACACIONES") {
        contenedor.innerHTML = `
            <input type="date" id="inicioVacaciones">
            <br><br>
            <input type="date" id="finVacaciones">
        `;
    }
}

function verHistorial() {
    const historial = JSON.parse(localStorage.getItem("documentos")) || [];

    let mensaje = "DOCUMENTOS GENERADOS:\n\n";

    historial.forEach(doc => {
        mensaje += `${doc.fecha} - ${doc.nombre} - ${doc.asunto}\n`;
    });

    alert(mensaje);
}