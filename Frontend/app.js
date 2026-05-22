const BASE_URL = "https://prodemundial-k6gn.onrender.com/api";

// 🔑 CONFIGURÁ ACÁ TU USUARIO Y CONTRASEÑA PREDETERMINADOS:
const CREDENCIALES_VALIDAS = {
    usuario: "admin",
    clave: "prode2026"
};

document.addEventListener("DOMContentLoaded", () => {
    // Configurar el comportamiento del formulario de Login
    configurarLogin();
    
    // Escuchar el selector de quién juega (para cuando ya esté logueado)
    document.getElementById("select-usuario-activo").addEventListener("change", cargarTableroPartidos);
    
    // Botón para cerrar sesión
    document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);
});

// 1. SISTEMA DE CONTROL DE ACCESO
function configurarLogin() {
    document.getElementById("form-login").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const userInput = document.getElementById("login-user").value;
        const passInput = document.getElementById("login-pass").value;

        // Validamos contra tus datos predeterminados
        if (userInput === CREDENCIALES_VALIDAS.usuario && passInput === CREDENCIALES_VALIDAS.clave) {
            // Ocultamos el login y mostramos el juego
            document.getElementById("pantalla-login").style.display = "none";
            document.getElementById("pantalla-juego").style.display = "block";
            
            // Activamos la carga de usuarios registrados en el backend
            cargarUsuariosDisponibles();
        } else {
            alert("❌ Usuario o Contraseña incorrectos. ¡Intenta de nuevo!");
        }
    });
}

function cerrarSesion() {
    // Volvemos todo a cero
    document.getElementById("form-login").reset();
    document.getElementById("pantalla-juego").style.display = "none";
    document.getElementById("pantalla-login").style.display = "flex";
    document.getElementById("select-usuario-activo").value = "";
    document.getElementById("contenedor-partidos").innerHTML = `<p class="cargando">Seleccioná tu usuario arriba para ver el fixture...</p>`;
}

// 2. TRAER JUGADORES REGISTRADOS DE LA API
async function cargarUsuariosDisponibles() {
    try {
        const res = await fetch(`${BASE_URL}/usuarios`);
        const usuarios = await res.json();
        const select = document.getElementById("select-usuario-activo");
        
        select.innerHTML = '<option value="">-- Seleccioná tu Usuario --</option>';
        usuarios.forEach(u => {
            select.innerHTML += `<option value="${u.id}">${u.nombre}</option>`;
        });
    } catch (error) {
        console.error("Error cargando usuarios:", error);
    }
}

// 3. DIBUJAR EL FIXTURE PRE-ARMADO
async function cargarTableroPartidos() {
    const usuarioId = document.getElementById("select-usuario-activo").value;
    const contenedor = document.getElementById("contenedor-partidos");
    
    if (!usuarioId) {
        contenedor.innerHTML = `<p class="cargando">Seleccioná un usuario arriba para ver el fixture y tus jugadas.</p>`;
        return;
    }

    try {
        // CORRECCIÓN: Ahora traemos Partidos, Equipos Y las Predicciones de este usuario en paralelo
        const [resPartidos, resEquipos, resPredicciones] = await Promise.all([
            fetch(`${BASE_URL}/partidos`),
            fetch(`${BASE_URL}/equipos`),
            fetch(`${BASE_URL}/predicciones?uId=${usuarioId}`) // Le pedimos sus jugadas a la API
        ]);

        const partidos = await resPartidos.json();
        const equipos = await resEquipos.json();
        const prediccionesUsuario = await resPredicciones.json();

        const mapaEquipos = {};
        equipos.forEach(e => mapaEquipos[e.id] = e);

        // Armamos un mapa rápido de predicciones usando el PartidoId como llave
        const mapaPredicciones = {};
        prediccionesUsuario.forEach(p => mapaPredicciones[p.partidoId] = p);

        contenedor.innerHTML = "";

        if (partidos.length === 0) {
            contenedor.innerHTML = `<p class="cargando">No hay partidos cargados en la API. Cargalos desde Swagger.</p>`;
            return;
        }

        partidos.forEach(partido => {
            const local = mapaEquipos[partido.localId] || { nombre: "Local", logoUrl: "" };
            const visitante = mapaEquipos[partido.visitanteId] || { nombre: "Visitante", logoUrl: "" };

            // Nos fijamos si este usuario ya tiene una jugada guardada para este partido
            const jugadaExistente = mapaPredicciones[partido.id];
            
            // Si ya votó, usamos sus goles; si no, arranca en 0
            const golesLocalDefault = jugadaExistente ? jugadaExistente.golesLocal : 0;
            const golesVisitanteDefault = jugadaExistente ? jugadaExistente.golesVisitante : 0;
            
            // Si ya tiene jugada, le cambiamos el color al botón para que sepa que ya está guardado
            const textoBoton = jugadaExistente ? "Actualizar" : "Arriesgar";
            const colorBoton = jugadaExistente ? "#059669" : "#0ea5e9"; // Verde si ya existe, azul si es nuevo

            const fila = document.createElement("div");
            fila.className = "tarjeta-formulario";
            fila.style = "margin-bottom: 12px;";
            
            fila.innerHTML = `
                <div style="flex: 1; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                    <span style="font-weight: bold;">${local.nombre}</span>
                    <img src="${local.logoUrl}" onerror="this.src='https://placehold.co/40?text=F'" style="width:40px; height:40px; object-fit:contain;">
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; background: #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px;">
                    <input type="number" id="pred-local-${partido.id}" min="0" value="${golesLocalDefault}" style="width: 50px; text-align: center; font-weight: bold; color: black;">
                    <span style="font-weight: bold; color: #64748b;">vs</span>
                    <input type="number" id="pred-visitante-${partido.id}" min="0" value="${golesVisitanteDefault}" style="width: 50px; text-align: center; font-weight: bold; color: black;">
                </div>

                <div style="flex: 1; text-align: left; display: flex; align-items: center; justify-content: flex-start; gap: 10px;">
                    <img src="${visitante.logoUrl}" onerror="this.src='https://placehold.co/40?text=F'" style="width:40px; height:40px; object-fit:contain;">
                    <span style="font-weight: bold;">${visitante.nombre}</span>
                </div>

                <div>
                    <button class="btn-guardar" onclick="guardarPrediccion('${partido.id}')" style="padding: 0.5rem 1rem; font-size: 0.9rem; width: auto; background-color: ${colorBoton};">
                        ${textoBoton}
                    </button>
                </div>
            `;
            contenedor.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al armar el tablero:", error);
    }
}


// BUSCÁ ESTA FUNCIÓN AL FINAL DE TU app.js Y REEMPLAZALA:
async function guardarPrediccion(partidoId) {
    const usuarioId = document.getElementById("select-usuario-activo").value;
    const golesLocal = parseInt(document.getElementById(`pred-local-${partidoId}`).value);
    const golesVisitante = parseInt(document.getElementById(`pred-visitante-${partidoId}`).value);

    // Validación de seguridad por si le da al botón sin elegir usuario
    if (!usuarioId) {
        alert("⚠️ Por favor, seleccioná quién está cargando arriba antes de arriesgar.");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/predicciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuarioId: usuarioId,
                partidoId: partidoId,
                golesLocalVoto: golesLocal,
                golesVisitanteVoto: golesVisitante
            })
        });

        if (res.ok) {
            const data = await res.json();
            alert(`✅ ${data.mensaje}\nResultado: ${golesLocal} - ${golesVisitante}`);
        } else {
            const err = await res.text();
            alert("❌ Error al guardar: " + err);
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor para guardar tu jugada.");
    }
}