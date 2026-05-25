const BASE_URL = "https://prodemundial-k6gn.onrender.com/api";

// 🔑 CONFIGURÁ ACÁ TU USUARIO Y CONTRASEÑA PREDETERMINADOS:
const CREDENCIALES_VALIDAS = {
    usuario: "admin",
    clave: "prode2026"
};

// 🌟 VARIABLE GLOBAL: Guarda qué pestaña está mirando el usuario
let pestañaActiva = "inicio"; 

// 🚀 UNIFICADO: La carga inicial de la página configurando todo el Front
// 🚀 UNIFICADO: La carga inicial de la página configurando todo el Front
document.addEventListener("DOMContentLoaded", () => {
    // Inicializar accesos y navegación de pantallas
    configurarLogin();
    configurarNavegacionLogin();
    configurarRegistro();
    configurarPestañas();
    
    // 🌟 Evento para el botón de Google (Se busca tanto en login como registro)
    const btnGoogle = document.getElementById("btn-google-register") || document.getElementById("btn-google-login");
    if (btnGoogle) {
        btnGoogle.addEventListener("click", iniciarSesionConGoogle);
    }
    
    // 🌟 Evento para abrir/cerrar el menú de perfil
    const btnPerfil = document.getElementById("btn-perfil");
    if (btnPerfil) {
        btnPerfil.addEventListener("click", (e) => {
            e.stopPropagation(); // Evita que se cierre al instante por el clic
            document.getElementById("dropdown-perfil").classList.toggle("show");
        });
    }

    // Cerrar el menú si el usuario hace clic en cualquier otra parte de la pantalla
    window.addEventListener("click", () => {
        const dropdown = document.getElementById("dropdown-perfil");
        if (dropdown && dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
        }
    });

    // Botón configurar perfil (Por ahora tira una alerta)
    document.getElementById("btn-configurar-perfil").addEventListener("click", (e) => {
        e.preventDefault();
        alert("⚙️ Próximamente: Acá vas a poder cambiar tu avatar y contraseña.");
    });
    
    // Escuchar el nuevo botón de cerrar sesión adentro del dropdown
    document.getElementById("btn-cerrar-sesion-nuevo").addEventListener("click", (e) => {
        e.preventDefault();
        cerrarSesion();
    });

    // Chequear sesión persistente al iniciar (Fix F5)
    verificarSesionExistente();
});

// 🌟 MANEJA EL CAMBIO ESTÉTICO Y LÓGICO DE LAS PESTAÑAS
function configurarPestañas() {
    const botones = document.querySelectorAll(".tab-btn");
    
    botones.forEach(btn => {
        btn.addEventListener("click", (e) => {
            // Sacamos la clase activa de todos los botones
            botones.forEach(b => b.classList.remove("active"));
            
            // Le ponemos activa al botón que clickeamos
            e.target.classList.add("active");
            
            // Guardamos cuál pestaña se seleccionó (fecha1, fecha2, etc.)
            pestañaActiva = e.target.getAttribute("data-tab");
            console.log("Cambiando a pestaña:", pestañaActiva);
            
            // Volvemos a renderizar el fixture con el filtro de la pestaña actual
            cargarTableroPartidos();
        });
    });
}

// 1. SISTEMA DE CONTROL DE ACCESO
// SISTEMA DE CONTROL DE ACCESO CONTRA LA API
function configurarLogin() {
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const userInput = document.getElementById("login-user").value.trim();
        const passInput = document.getElementById("login-pass").value.trim();

        // Mantenemos tu bypass de Admin local por si las moscas para pruebas rápidas
        if (userInput === CREDENCIALES_VALIDAS.usuario && passInput === CREDENCIALES_VALIDAS.clave) {
            const adminSession = { id: "00000000-0000-0000-0000-000000000000", nombre: userInput };
            localStorage.setItem("usuarioProde", JSON.stringify(adminSession));
            document.getElementById("nombre-usuario-header").innerText = userInput;
            document.getElementById("pantalla-login").style.display = "none";
            document.getElementById("pantalla-juego").style.display = "block";
            cargarTableroPartidos();
            return;
        }

        try {
            // Le pegamos al endpoint de login de tu API en .NET
            const res = await fetch(`${BASE_URL}/usuarios/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userInput, // o usuario, según espere tu DTO en C#
                    password: passInput
                })
            });

            if (res.ok) {
                // Tu API nos devuelve el usuario real de la BD: { id: "guid...", nombre: "Juan Perez" }
                const usuarioLogueado = await res.json(); 

                localStorage.setItem("usuarioProde", JSON.stringify(usuarioLogueado));
                document.getElementById("nombre-usuario-header").innerText = usuarioLogueado.nombre;

                document.getElementById("pantalla-login").style.display = "none";
                document.getElementById("pantalla-juego").style.display = "block";
                
                cargarTableroPartidos();
            } else {
                const errText = await res.text();
                alert("❌ Error de ingreso: " + errText);
            }
        } catch (error) {
            console.error("Error en el Login:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });
}

// Cambiar entre el formulario de Login y el de Registro
function configurarNavegacionLogin() {
    const linkRegistro = document.getElementById("link-ir-a-registro");
    const linkLogin = document.getElementById("link-ir-a-login");
    const vistaLogin = document.getElementById("vista-login");
    const vistaRegistro = document.getElementById("vista-registro");

    linkRegistro.addEventListener("click", (e) => {
        e.preventDefault();
        vistaLogin.style.display = "none";
        vistaRegistro.style.display = "block";
    });

    linkLogin.addEventListener("click", (e) => {
        e.preventDefault();
        vistaRegistro.style.display = "none";
        vistaLogin.style.display = "block";
    });
}

// Enviar el nuevo usuario a la API de .NET
// Enviar el nuevo usuario a la API de .NET con todos sus campos
function configurarRegistro() {
    document.getElementById("form-registro").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Capturamos los 3 inputs reales de tu HTML
        const nuevoNombre = document.getElementById("reg-user").value.trim();
        const nuevoEmail = document.getElementById("reg-email").value.trim();
        const nuevaPass = document.getElementById("reg-pass").value.trim();

        if (!nuevoNombre || !nuevoEmail || !nuevaPass) {
            alert("⚠️ Por favor, completa todos los campos del formulario.");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: nuevoNombre,
                    email: nuevoEmail,
                    password: nuevaPass // Enviamos la estructura completa a C#
                })
            });

            if (res.ok) {
                alert(`🎯 ¡Usuario "${nuevoNombre}" creado con éxito!\nRevisá tu mail (${nuevoEmail}) para verificar tu cuenta antes de ingresar.`);
                document.getElementById("form-registro").reset();
                document.getElementById("link-ir-a-login").click(); // Te manda al Login automático
            } else {
                const errText = await res.text();
                alert("❌ No se pudo crear el usuario: " + errText);
            }
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            alert("Hubo un problema de conexión con el servidor.");
        }
    });
}

// 🌐 FLUJO DE GOOGLE AUTH
function iniciarSesionConGoogle(e) {
    e.preventDefault();
    console.log("Redirigiendo a Google Auth...");
    
    const SUPABASE_PROJECT_URL = "https://your-project-id.supabase.co"; 
    const redirectUrl = window.location.origin; 
    
    window.location.href = `${SUPABASE_PROJECT_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
}

function cerrarSesion() {
    // Borramos el localStorage para que no se autologuee de nuevo al salir
    localStorage.removeItem("usuarioProde");

    // Volvemos todo a cero
    document.getElementById("form-login").reset();
    document.getElementById("pantalla-juego").style.display = "none";
    document.getElementById("pantalla-login").style.display = "flex";
    document.getElementById("contenedor-partidos").innerHTML = "";
}

// 2. DIBUJAR EL FIXTURE FILTRADO POR PESTAÑAS
async function cargarTableroPartidos() {
    const contenedor = document.getElementById("contenedor-partidos");
    
    // Buscamos el usuario de la sesión activa en localStorage
    const usuarioGuardado = localStorage.getItem("usuarioProde");
    if (!usuarioGuardado) return;
    
    const usuario = JSON.parse(usuarioGuardado);
    
    // Si no hay ID válido, usamos el del admin o dejamos pasar para que intente
    const usuarioId = usuario.id || 1; 

    // Control de la pestaña de Posiciones Generales
    if (pestañaActiva === "general") {
        contenedor.innerHTML = `
            <div class="tarjeta-formulario" style="text-align: center; color: white;">
                <h2>📊 Tabla de Posiciones Generales</h2>
                <p>Acá va a ir la tabla con los puntajes acumulados de todos los pibes de la app.</p>
            </div>`;
        return;
    }

    // Pestaña Inicio
    if (pestañaActiva === "inicio") {
        contenedor.innerHTML = `
            <div class="tarjeta-formulario" style="text-align: center; color: white; padding: 2rem;">
                <h2>⚽ ¡Bienvenido al Prode Mundial 2026!</h2>
                <p>Seleccioná cualquiera de las fechas arriba en la barra para empezar a tirar tus pronósticos.</p>
            </div>`;
        return;
    }

    try {
        // 🌟 PASO 1: Traemos Partidos y Equipos en paralelo
        const [resPartidos, resEquipos] = await Promise.all([
            fetch(`${BASE_URL}/partidos`),
            fetch(`${BASE_URL}/equipos`)
        ]);

        const partidos = await resPartidos.json();
        const equipos = await resEquipos.json();

        if (partidos.length > 0) {
    console.log("👉 PROPIEDADES DEL PARTIDO DE LA BD:", partidos[0]);
}

        // 🌟 PASO 2: Traemos predicciones aisladas en su propio try/catch
        // Si la API tira 400 (Bad Request), el catch lo atrapa y el fixture se muestra igual en cero
        let prediccionesUsuario = [];
        try {
            const resPredicciones = await fetch(`${BASE_URL}/predicciones?uId=${usuarioId}`);
            if (resPredicciones.ok) {
                prediccionesUsuario = await resPredicciones.json();
            } else {
                console.warn(`⚠️ La API de predicciones devolvió status ${resPredicciones.status}. Se continúa con fixture limpio.`);
            }
        } catch (errPred) {
            console.warn("❌ Error de red al consultar predicciones, se ignora:", errPred);
        }

        const mapaEquipos = {};
        equipos.forEach(e => mapaEquipos[e.id] = e); 

        const mapaPredicciones = {};
        prediccionesUsuario.forEach(p => mapaPredicciones[p.partidoId] = p); 

        contenedor.innerHTML = "";

        // 🌟 PASO 3: Filtrar los partidos que corresponden a la pestaña
        // 🌟 PASO 3: Filtrar los partidos usando los IDs reales de tu Base de Datos
        // Agregá acá adentro los códigos GUID de las demás fechas a medida que las crees
        const equivalenciasFechas = {
            "03ad09d5-7d3e-4d0e-a473-cbd8837fe590": "fecha1", // 👈 Este es el ID real de tu captura
            "AQUÍ_EL_ID_DE_LA_FECHA_2": "fecha2",
            "AQUÍ_EL_ID_DE_LA_FECHA_3": "fecha3",
            "AQUÍ_EL_ID_DE_16AVOS": "16avos",
            "AQUÍ_EL_ID_DE_OCTAVOS": "octavos",
            "AQUÍ_EL_ID_DE_CUARTOS": "cuartos",
            "AQUÍ_EL_ID_DE_SEMIS": "semis",
            "AQUÍ_EL_ID_DE_LA_FINAL": "final"
        };

        const partidosFiltrados = partidos.filter(p => {
            if (!p.fechaId) return false; // Cambiado a 'fechaId' que es tu campo real

            // Buscamos a qué pestaña de texto pertenece este ID de la BD
            const pestañaAsociada = equivalenciasFechas[p.fechaId];

            // Comparamos si coincide con la pestaña que el usuario tiene abierta
            return pestañaAsociada === pestañaActiva;
        });

        if (partidosFiltrados.length === 0) {
            contenedor.innerHTML = `<p class="cargando">No hay partidos cargados para la sección: <b>${pestañaActiva}</b> todavía.</p>`;
            return;
        }

        // 🌟 PASO 4: Dibujar las tarjetas en la pantalla
        partidosFiltrados.forEach(partido => {
            const local = mapaEquipos[partido.localId] || { nombre: "Local", logoUrl: "" };
            const visitante = mapaEquipos[partido.visitanteId] || { nombre: "Visitante", logoUrl: "" };

            const jugadaExistente = mapaPredicciones[partido.id]; 
            
            const golesLocalDefault = jugadaExistente ? jugadaExistente.golesLocalVoto : 0;
            const golesVisitanteDefault = jugadaExistente ? jugadaExistente.golesVisitanteVoto : 0;
            
            const textoBoton = jugadaExistente ? "Actualizar" : "Arriesgar";
            const claseBoton = jugadaExistente ? "btn-guardar btn-actualizar" : "btn-guardar"; 

            const fila = document.createElement("div");
            fila.className = "tarjeta-formulario";
            fila.style = "margin-bottom: 16px;"; 
            
            fila.innerHTML = `
                <div class="bloque-equipo local">
                    <span class="nombre-equipo">${local.nombre}</span>
                    <img src="${local.logoUrl}" onerror="this.src='https://placehold.co/40?text=⚽'" class="escudo">
                </div>

                <div class="bloque-goles">
                    <input type="number" id="pred-local-${partido.id}" min="0" value="${golesLocalDefault}">
                    <span class="versus">VS</span>
                    <input type="number" id="pred-visitante-${partido.id}" min="0" value="${golesVisitanteDefault}">
                </div>

                <div class="bloque-equipo visitante">
                    <img src="${visitante.logoUrl}" onerror="this.src='https://placehold.co/40?text=⚽'" class="escudo">
                    <span class="nombre-equipo">${visitante.nombre}</span>
                </div>

                <div class="bloque-accion">
                    <button class="${claseBoton}" onclick="guardarPrediccion('${partido.id}')">
                        ${textoBoton}
                    </button>
                </div>
            `;
            contenedor.appendChild(fila);
        });

    } catch (error) {
        console.error("❌ Error crítico al armar el tablero:", error);
        contenedor.innerHTML = `<p class="cargando" style="color: #ef4444;">Hubo un error al cargar los datos del servidor.</p>`;
    }
}

// 3. GUARDAR JUGADA EN LA API
async function guardarPrediccion(partidoId) {
    // 🌟 CORRECCIÓN CLAVE: Sacamos el ID del usuario directamente del localStorage
    const usuarioGuardado = localStorage.getItem("usuarioProde");
    if (!usuarioGuardado) {
        alert("⚠️ No se detectó una sesión activa. Volvé a ingresar.");
        return;
    }
    
    const usuario = JSON.parse(usuarioGuardado);
    const usuarioId = usuario.id;

    const golesLocal = parseInt(document.getElementById(`pred-local-${partidoId}`).value);
    const golesVisitante = parseInt(document.getElementById(`pred-visitante-${partidoId}`).value);

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

// 🌐 FLUJO DE GOOGLE AUTH VIA SUPABASE
function iniciarSesionConGoogle(e) {
    e.preventDefault();
    console.log("Redirigiendo a Google Auth...");
    
// 🌟 1. Tu URL real que vimos en la última captura:
    const SUPABASE_PROJECT_URL = "https://qtabvayxldwetjxgrqqm.supabase.co"; 
    
    // 🌟 2. Tu clave que copiaste de la anteúltima captura:
    const SUPABASE_ANON_KEY = "sb_publishable_zF0BeJbOjnfVB3zUMytneQ_oZK04Il9"; // (Ponela completa acá)
    
    // Detecta automáticamente si estás en local (127.0.0.1) o en producción
    const redirectUrl = window.location.origin; 
    
    // Redirección oficial pasando la apikey para evitar el error anterior
    window.location.href = `${SUPABASE_PROJECT_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&apikey=${SUPABASE_ANON_KEY}`;
}
// 4. CONTROLADOR DE PERSISTENCIA (FIX F5 Y CAPTURA DE GOOGLE)
function verificarSesionExistente() {
    // 🌟 NUEVO: Si venimos volviendo de loguearnos con Google, la URL trae un #access_token
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
        // Limpiamos la URL para borrar el token largo de la barra de direcciones
        window.history.replaceState(null, null, " ");
        
        // Armamos la sesión con el usuario que se logueó por Google
        const usuarioGoogle = { 
            id: "google-oauth-user", // Supabase lo asocia internamente en auth.users
            nombre: "Jugador Google" 
        };
        localStorage.setItem("usuarioProde", JSON.stringify(usuarioGoogle));
    }

    const usuarioGuardado = localStorage.getItem("usuarioProde");

    if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado); 
        document.getElementById("nombre-usuario-header").innerText = usuario.nombre;
        document.getElementById("pantalla-login").style.display = "none";
        document.getElementById("pantalla-juego").style.display = "block";
        cargarTableroPartidos();
    }
}