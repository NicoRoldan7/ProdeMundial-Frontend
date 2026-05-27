const BASE_URL = "https://prodemundial-k6gn.onrender.com/api";

// 🔑 CONFIGURÁ ACÁ TU USUARIO Y CONTRASEÑA PREDETERMINADOS:
const CREDENCIALES_VALIDAS = {
    usuario: "admin",
    clave: "prode2026"
};


// Desestructuramos para evitar el error de "is not a function"
const { createClient } = supabase;

// Inicializamos el cliente con el nombre 'db' para que no pise nada
const db = createClient('https://qtabvayxldwetjxgrqqm.supabase.co', 'sb_publishable_zF0BeJbOjnfVB3zUMytneQ_oZK04Il9');

// 🌟 VARIABLE GLOBAL: Guarda qué pestaña está mirando el usuario
let pestañaActiva = "inicio"; 

// 🚀 UNIFICADO: La carga inicial de la página configurando todo el Front
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando aplicación...");

    // 🔥 Inicializar los clics de las pestañas de una (afecta a PC y celular)
    configurarPestañas();

    // =========================================================================
    // 🌟 CAPTURAR DATOS DE GOOGLE CUANDO SE REDIRIGE DESDE SUPABASE (SINCRONIZADO)
    // =========================================================================
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");
        
        if (accessToken) {
            console.log("¡Logueado con Google con éxito!");
            
            // Ponemos un aviso visual temporal en los títulos mientras procesa el Backend
            const titulo = document.getElementById("titulo-bienvenida");
            const subtitulo = document.getElementById("subtitulo-bienvenida");
            if (titulo) titulo.innerText = "⏳ SINCRONIZANDO...";
            if (subtitulo) subtitulo.innerText = "Conectando tu cuenta de Google con el Prode, espera un momento...";

            try {
                // Abrimos el token para sacar los datos reales de Google
                const tokenParts = accessToken.split('.');
                const userPayload = JSON.parse(atob(tokenParts[1]));
                
                // Sacamos la info que nos provee Google
                const nombreReal = userPayload.user_metadata?.full_name || userPayload.user_metadata?.name || "Jugador Google";
                const uIdReal = userPayload.sub; // Tu GUID real de Supabase
                const emailReal = userPayload.email; // El correo electrónico

                // 🔥 ENVIAMOS LOS DATOS A NUESTRO BACKEND PARA GUARDARLO O LOGUEARLO
                const res = await fetch(`${BASE_URL}/usuarios/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: uIdReal,
                        nombre: nombreReal,
                        email: emailReal
                    })
                });

                if (res.ok) {
                    const usuarioBackend = await res.json();
                    
                    // Guardamos la sesión oficial del Backend en el LocalStorage
                    localStorage.setItem("usuarioProde", JSON.stringify(usuarioBackend));
                    
                    // Pasamos directo a la pantalla de juego
                    document.getElementById("nombre-usuario-header").innerText = usuarioBackend.nombre;
                    document.getElementById("pantalla-login").style.display = "none";
                    document.getElementById("pantalla-juego").style.display = "block";
                    cargarTableroPartidos();
                } else {
                    alert("❌ Error al sincronizar tu cuenta de Google con el servidor del Prode.");
                    // Reestablecemos el texto de bienvenida si falló
                    if (titulo) titulo.innerText = "¡BIENVENIDO AL PRODE MUNDIALISTA!";
                }

            } catch (e) {
                console.error("Error al decodificar o sincronizar el token de Google:", e);
                alert("❌ Ocurrió un error inesperado procesando la sesión de Google.");
            }
            
            // Limpiamos la URL para borrar el token largo de la barra de direcciones
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    // =========================================================================
    
    // Inicializar accesos y navegación de pantallas
    configurarLogin();
    configurarNavegacionLogin(); 
    configurarRegistro();
    
    // 🌟 Eventos para los botones de Google (Login y Registro)
    const btnGoogleLogin = document.getElementById("btn-google-login");
    const btnGoogleRegister = document.getElementById("btn-google-register");
    
    if (btnGoogleLogin) btnGoogleLogin.addEventListener("click", iniciarSesionConGoogle);
    if (btnGoogleRegister) btnGoogleRegister.addEventListener("click", iniciarSesionConGoogle);
    
// 🌟 Evento para abrir/cerrar el menú de perfil
// 1. Seleccionamos los elementos
const btnPerfil = document.getElementById("btn-perfil");
const dropdown = document.getElementById("dropdown-perfil");

// 2. Lógica de toggle directo
if (btnPerfil && dropdown) {
    btnPerfil.addEventListener("click", (e) => {
        e.stopPropagation(); // Evitamos que el clic se propague y cierre el menú

        // Si ya está abierto, lo cerramos
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            dropdown.style.display = "none";
        } else {
            // Si está cerrado, hacemos el "teletransporte" y lo abrimos
            document.body.appendChild(dropdown);
            
            const rect = btnPerfil.getBoundingClientRect();
            dropdown.style.position = "fixed";
            dropdown.style.zIndex = "999999999";
            dropdown.style.display = "block";
            
            // Posicionamiento
            dropdown.style.top = (rect.bottom + 5) + "px";
            dropdown.style.right = "205px";
            dropdown.style.width = window.innerWidth <= 650 ? "calc(100% - 20px)" : "200px";
            
            dropdown.classList.add("show");
        }
    });
}

// 3. Cierre global (mejorado para no interferir)
window.addEventListener("click", (e) => {
    // Si el clic no fue dentro del menú, lo cerramos
    if (dropdown && !dropdown.contains(e.target) && !btnPerfil.contains(e.target)) {
        dropdown.classList.remove("show");
        dropdown.style.display = "none";
    }
});

// Cierre global
window.addEventListener("click", () => {
    if (dropdown) {
        dropdown.classList.remove("show");
        dropdown.style.display = "none";
    }
});

// 🌟 Evento para cerrar al hacer clic afuera
window.addEventListener("click", () => {
    if (dropdown) dropdown.classList.remove("show");
});

    // Cerrar el menú de perfil si el usuario hace clic afuera
    window.addEventListener("click", () => {
        const dropdown = document.getElementById("dropdown-perfil");
        if (dropdown && dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
        }
    });

    // =========================================================================
    // ⚙️ LÓGICA DEL MODAL: CONFIGURAR PERFIL
    // =========================================================================
    const btnConfig = document.getElementById("btn-configurar-perfil");
    const modalPerfil = document.getElementById("modal-perfil");
    const btnCerrarModal = document.getElementById("btn-cerrar-modal");
    const formConfigPerfil = document.getElementById("form-configurar-perfil");

    if (btnConfig && modalPerfil) {
        btnConfig.addEventListener("click", (e) => {
            e.preventDefault();
            
            const usuarioGuardado = localStorage.getItem("usuarioProde");
            if (!usuarioGuardado) return;
            const usuario = JSON.parse(usuarioGuardado);

            document.getElementById("config-nombre").value = usuario.nombre;
            document.getElementById("config-pass").value = ""; 

            modalPerfil.style.display = "flex";
        });
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener("click", () => {
            modalPerfil.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === modalPerfil) {
            modalPerfil.style.display = "none";
        }
    });

    if (formConfigPerfil) {
        formConfigPerfil.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const usuarioGuardado = localStorage.getItem("usuarioProde");
            if (!usuarioGuardado) return;
            const usuario = JSON.parse(usuarioGuardado);

            const nuevoNombre = document.getElementById("config-nombre").value.trim();
            const nuevaPass = document.getElementById("config-pass").value.trim();

            const datosActualizados = { nombre: nuevoNombre };
            if (nuevaPass !== "") {
                datosActualizados.password = nuevaPass;
            }

            // Efecto visual de guardado para el botón del modal
            const btnGuardarPerfil = formConfigPerfil.querySelector("button[type='submit']");
            const textoOriginalBtn = btnGuardarPerfil ? btnGuardarPerfil.innerText : "GUARDAR CAMBIOS";
            if (btnGuardarPerfil) {
                btnGuardarPerfil.disabled = true;
                btnGuardarPerfil.innerText = "GUARDANDO... ⏳";
            }

            try {
                const res = await fetch(`${BASE_URL}/usuarios/${usuario.id}`, {
                    method: "PUT", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosActualizados)
                });

                if (res.ok) {
                    usuario.nombre = nuevoNombre;
                    localStorage.setItem("usuarioProde", JSON.stringify(usuario));

                    document.getElementById("nombre-usuario-header").innerText = nuevoNombre;
                    const btnPerfil = document.getElementById("btn-perfil");
                    if (btnPerfil) btnPerfil.innerHTML = `<span>👤</span> ${nuevoNombre} <span>▼</span>`;

                    alert("✅ ¡Perfil actualizado con éxito!");
                    modalPerfil.style.display = "none"; 
                } else {
                    const errText = await res.text();
                    alert("❌ No se pudieron guardar los cambios: " + errText);
                }
            } catch (error) {
                console.error("Error al actualizar perfil:", error);
                alert("Hubo un problema de conexión para guardar los datos.");
            } finally {
                if (btnGuardarPerfil) {
                    btnGuardarPerfil.disabled = false;
                    btnGuardarPerfil.innerText = textoOriginalBtn;
                }
            }
        });
    }
    
    function cerrarTodosLosMenus() {
    const dropdownFechas = document.getElementById("dropdown-fechas-contenido");
    const dropdownPerfil = document.getElementById("dropdown-perfil");
    
    if (dropdownFechas) dropdownFechas.style.display = "none";
    if (dropdownPerfil) dropdownPerfil.classList.remove("show");
}
    
    // Escuchar el botón de cerrar sesión
    const btnCerrar = document.getElementById("btn-cerrar-sesion-nuevo");
    if (btnCerrar) {
        btnCerrar.addEventListener("click", (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }

    // =========================================================================
    // 📱 NUEVA LÓGICA EXCLUSIVA: DESPLEGABLE DE FECHAS PARA CELULARES
    // =========================================================================
  // 📱 FIX RADICAL: El menú se mueve al body y se posiciona inline
// 📱 FIX: Solo mover al body si es pantalla chica (Móvil)
const btnFechas = document.getElementById("btn-fechas-trigger");
const dropdownFechas = document.getElementById("dropdown-fechas-contenido");

if (btnFechas && dropdownFechas) {
    // Aseguramos que esté oculto al iniciar
    dropdownFechas.style.display = "none";

    btnFechas.addEventListener("click", (e) => {
        e.stopPropagation();

        // Si está oculto, lo mostramos y posicionamos
        if (dropdownFechas.style.display === "none") {
            // Mover al body solo si es móvil para evitar conflictos
            if (window.innerWidth <= 650) {
                document.body.appendChild(dropdownFechas);
            }

            const rect = btnFechas.getBoundingClientRect();
            dropdownFechas.style.display = "block";
            dropdownFechas.style.position = "absolute";
            dropdownFechas.style.top = (rect.bottom + window.scrollY) + "px";
            dropdownFechas.style.left = "50%";
            dropdownFechas.style.transform = "translateX(-50%)";
            dropdownFechas.style.zIndex = "99999999";
        } else {
            // Si ya está visible, lo ocultamos
            dropdownFechas.style.display = "none";
        }
    });

    // Cerrar al hacer clic fuera
    window.addEventListener("click", () => {
        dropdownFechas.style.display = "none";
    });
}

    // =========================================================================
    // 📥 BOTÓN GLOBAL DE GUARDAR PREDICCIÓN
    // =========================================================================
    const btnGuardarGlobal = document.getElementById("btn-guardar-prediccion-global");
    if (btnGuardarGlobal) {
        btnGuardarGlobal.addEventListener("click", guardarPrediccionGlobal);
    }
    // =========================================================================

    // Chequear sesión persistente al iniciar (Fix F5)
    verificarSesionExistente();
});


// =========================================================================
// 🔄 1. SISTEMA DE CONTROL DE ACCESO (TRADICIONAL)
// =========================================================================
function configurarLogin() {
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const userInput = document.getElementById("login-user").value.trim();
        const passInput = document.getElementById("login-pass").value.trim();

        if (userInput === CREDENCIALES_VALIDAS.usuario && passInput === CREDENCIALES_VALIDAS.clave) {
            const adminSession = { id: "00000000-0000-0000-0000-000000000000", nombre: userInput };
            localStorage.setItem("usuarioProde", JSON.stringify(adminSession));
            document.getElementById("nombre-usuario-header").innerText = userInput;
            document.getElementById("pantalla-login").style.display = "none";
            document.getElementById("pantalla-juego").style.display = "block";
            cargarTableroPartidos();
            return;
        }

        // feedback visual en el login tradicional
        const btnLogin = e.target.querySelector("button[type='submit']");
        if (btnLogin) {
            btnLogin.disabled = true;
            btnLogin.innerText = "INGRESANDO... ⏳";
        }

        try {
            const res = await fetch(`${BASE_URL}/usuarios/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inputUsuario: userInput, 
                    password: passInput
                })
            });

            if (res.ok) {
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
        } finally {
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.innerText = "INGRESAR";
            }
        }
    });
}

// =========================================================================
// 🧭 NAVEGACIÓN DINÁMICA DE LA BIENVENIDA MUNDIALISTA
// =========================================================================
function configurarNavegacionLogin() {
    const bloqueInicial = document.getElementById("bloque-opciones-iniciales");
    const vistaLogin = document.getElementById("vista-login");
    const vistaRegistro = document.getElementById("vista-registro");
    
    const titulo = document.getElementById("titulo-bienvenida");
    const subtitulo = document.getElementById("subtitulo-bienvenida");

    const btnElegirIngreso = document.getElementById("btn-elegir-ingreso");
    const btnElegirRegistro = document.getElementById("btn-elegir-registro");
    const btnVolverLogin = document.getElementById("btn-volver-login");
    const btnVolverRegistro = document.getElementById("btn-volver-registro");
    const btnOlvideClave = document.getElementById("btn-olvide-clave");

    // 1. Click en INICIAR SESIÓN
    if (btnElegirIngreso) {
        btnElegirIngreso.addEventListener("click", () => {
            bloqueInicial.style.display = "none";
            vistaRegistro.style.display = "none";
            vistaLogin.style.display = "block";
            titulo.innerText = "INGRESO AL PRODE";
            subtitulo.innerText = "Ingresá con tus credenciales o vía Google";
        });
    }

    // 2. Click en CREAR USUARIO
    if (btnElegirRegistro) {
        btnElegirRegistro.addEventListener("click", () => {
            bloqueInicial.style.display = "none";
            vistaLogin.style.display = "none";
            vistaRegistro.style.display = "block";
            titulo.innerText = "NUEVO JUGADOR";
            subtitulo.innerText = "Creá tu cuenta de juego para empezar a sumar puntos";
        });
    }

    // 3. Botón volver desde el Login
    if (btnVolverLogin) {
        btnVolverLogin.addEventListener("click", (e) => {
            e.preventDefault();
            vistaLogin.style.display = "none";
            bloqueInicial.style.display = "flex";
            titulo.innerText = "¡BIENVENIDO AL PRODE MUNDIALISTA!";
            subtitulo.innerText = "Elegí cómo querés ingresar a tirar tus pronósticos";
        });
    }

    // 4. Botón volver desde el Registro
    if (btnVolverRegistro) {
        btnVolverRegistro.addEventListener("click", (e) => {
            e.preventDefault();
            vistaRegistro.style.display = "none";
            bloqueInicial.style.display = "flex";
            titulo.innerText = "¡BIENVENIDO AL PRODE MUNDIALISTA!";
            subtitulo.innerText = "Elegí cómo querés ingresar a tirar tus pronósticos";
        });
    }

    // 5. Olvidé mi clave
    if (btnOlvideClave) {
        btnOlvideClave.addEventListener("click", (e) => {
            e.preventDefault();
            alert("🔒 Para resetear tu clave, comunicate con el administrador del torneo.");
        });
    }
}

// =========================================================================
// 🔄 CONFIGURACIÓN DEL REGISTRO TRADICIONAL
// =========================================================================
function configurarRegistro() {
    document.getElementById("form-registro").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nuevoNombre = document.getElementById("reg-user").value.trim();
        const nuevoUsername = document.getElementById("reg-username").value.trim(); 
        const nuevoEmail = document.getElementById("reg-email").value.trim();
        const nuevaPass = document.getElementById("reg-pass").value.trim();

        if (!nuevoNombre || !nuevoUsername || !nuevoEmail || !nuevaPass) {
            alert("⚠️ Por favor, completa todos los campos del formulario.");
            return;
        }

        // 🔥 FEEDBACK DE ESPERA: Evita que piensen que se colgó por culpa de BCrypt
        const btnRegistro = e.target.querySelector("button[type='submit']");
        if (btnRegistro) {
            btnRegistro.disabled = true;
            btnRegistro.innerText = "CREANDO CUENTA... ⏳";
        }

        try {
            const res = await fetch(`${BASE_URL}/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: nuevoNombre,
                    username: nuevoUsername, 
                    email: nuevoEmail,
                    password: nuevaPass
                })
            });

            if (res.ok) {
                alert(`🎯 ¡Usuario "${nuevoUsername}" creado con éxito!\nYa podés ingresar usando tu usuario y contraseña.`);
                document.getElementById("form-registro").reset();
                
                // Forzamos el volver atrás automático al menú principal
                document.getElementById("btn-volver-registro").click(); 
            } else {
                const errText = await res.text();
                alert("❌ No se pudo crear el usuario: " + errText);
            }
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            alert("Hubo un problema de conexión con el servidor.");
        } finally {
            // Reestablecemos el botón a su estado normal si terminó
            if (btnRegistro) {
                btnRegistro.disabled = false;
                btnRegistro.innerText = "REGISTRARME";
            }
        }
    });
}

function cerrarSesion() {
    localStorage.removeItem("usuarioProde");
    document.getElementById("form-login").reset();
    document.getElementById("pantalla-juego").style.display = "none";
    document.getElementById("pantalla-login").style.display = "flex";
    document.getElementById("contenedor-partidos").innerHTML = "";
    
    // Reseteamos la pantalla de bienvenida al menú de botones limpio
    document.getElementById("vista-registro").style.display = "none";
    document.getElementById("vista-login").style.display = "none";
    document.getElementById("bloque-opciones-iniciales").style.display = "flex";
    document.getElementById("titulo-bienvenida").innerText = "¡BIENVENIDO AL PRODE MUNDIALISTA!";
    document.getElementById("subtitulo-bienvenida").innerText = "Elegí cómo querés ingresar a tirar tus pronósticos";
}

// 2. DIBUJAR EL FIXTURE FILTRADO POR PESTAÑAS
async function cargarTableroPartidos() {
    if (pestañaActiva === "inicio") return;
    const contenedor = document.getElementById("contenedor-partidos");
    const btnGlobalContainer = document.querySelector(".contenedor-boton-global");
    if (!contenedor) return; // Seguridad extra
    const usuarioGuardado = localStorage.getItem("usuarioProde");
    if (!usuarioGuardado) return;
    
    const usuario = JSON.parse(usuarioGuardado);
    const usuarioId = usuario.id || 1; 

    if (btnGlobalContainer) btnGlobalContainer.style.display = "none";

    if (pestañaActiva === "general") {
        contenedor.innerHTML = `
            <div class="tarjeta-formulario" style="text-align: center; color: white;">
                <h2>📊 Tabla de Posiciones Generales</h2>
                <p>Acá va a ir la tabla con los puntajes acumulados de todos los pibes de la app.</p>
            </div>`;
        return;
    }

// En tu función de cambio de pestaña:
if (pestañaActiva === "inicio") {
    // 1. Limpiamos el contenedor (opcional pero recomendado)
    const contenedor = document.getElementById("vista-inicio");
    contenedor.innerHTML = ""; 
}

    try {
        const [resPartidos, resEquipos] = await Promise.all([
            fetch(`${BASE_URL}/partidos`),
            fetch(`${BASE_URL}/equipos`)
        ]);

        const partidos = await resPartidos.json();
        const equipos = await resEquipos.json();

        let prediccionesUsuario = [];
        try {
            const resPredicciones = await fetch(`${BASE_URL}/predicciones?uId=${usuarioId}`);
            if (resPredicciones.ok) {
                prediccionesUsuario = await resPredicciones.json();
            }
        } catch (errPred) {
            console.warn("❌ Error al consultar predicciones, se ignora:", errPred);
        }

        const mapaEquipos = {};
        equipos.forEach(e => mapaEquipos[e.id] = e); 

        const mapaPredicciones = {};
        prediccionesUsuario.forEach(p => mapaPredicciones[p.partidoId] = p); 

        contenedor.innerHTML = "";

        // Equivalencias de GUIDs para las fechas
        const equivalenciasFechas = {
            "03ad09d5-7d3e-4d0e-a473-cbd8837fe590": "fecha1"
        };

        const partidosFiltrados = partidos.filter(p => {
            if (!p.fechaId) return false;
            const pestañaAsociada = equivalenciasFechas[p.fechaId];
            return pestañaAsociada === pestañaActiva;
        });

        if (partidosFiltrados.length === 0) {
            contenedor.innerHTML = `<p class="cargando">No hay partidos cargados para la sección: <b>${pestañaActiva}</b> todavía.</p>`;
            return;
        }

        if (btnGlobalContainer) btnGlobalContainer.style.display = "flex";

        partidosFiltrados.forEach(partido => {
            const local = mapaEquipos[partido.localId] || { nombre: "Local", logoUrl: "" };
            const visitante = mapaEquipos[partido.visitanteId] || { nombre: "Visitante", logoUrl: "" };

            const jugadaExistente = mapaPredicciones[partido.id]; 
            const golesLocalDefault = jugadaExistente ? jugadaExistente.golesLocalVoto : 0;
            const golesVisitanteDefault = jugadaExistente ? jugadaExistente.golesVisitanteVoto : 0;

            const fila = document.createElement("div");
            fila.className = "tarjeta-formulario";
            fila.setAttribute("data-partido-id", partido.id); 
            fila.style = "margin-bottom: 16px;"; 
            
            fila.innerHTML = `
                <div class="bloque-equipo local">
                    <span class="nombre-equipo">${local.nombre}</span>
                    <img src="${local.logoUrl}" onerror="this.src='https://placehold.co/40?text=⚽'" class="escudo">
                </div>
                <div class="bloque-goles">
                    <input type="number" class="input-goles-local" data-partido="${partido.id}" min="0" value="${golesLocalDefault}">
                    <span class="versus">VS</span>
                    <input type="number" class="input-goles-visitante" data-partido="${partido.id}" min="0" value="${golesVisitanteDefault}">
                </div>
                <div class="bloque-equipo visitante">
                    <img src="${visitante.logoUrl}" onerror="this.src='https://placehold.co/40?text=⚽'" class="escudo">
                    <span class="nombre-equipo">${visitante.nombre}</span>
                </div>
            `;
            contenedor.appendChild(fila);
        });

    } catch (error) {
        console.error("❌ Error crítico al armar el tablero:", error);
        contenedor.innerHTML = `<p class="cargando" style="color: #ef4444;">Hubo un error al cargar los datos del servidor.</p>`;
    }
}

// 3. ENVIAR PREDICCIONES EN BLOQUE A LA API
async function guardarPrediccionGlobal() {
    const usuarioGuardado = localStorage.getItem("usuarioProde");
    if (!usuarioGuardado) {
        alert("⚠️ No se detectó una sesión activa. Volvé a ingresar.");
        return;
    }
    
    const usuario = JSON.parse(usuarioGuardado);
    const usuarioId = usuario.id;

    const tarjetas = document.querySelectorAll(".tarjeta-formulario[data-partido-id]");
    
    if (tarjetas.length === 0) {
        alert("No hay partidos para guardar.");
        return;
    }

    const btnGlobal = document.getElementById("btn-guardar-prediccion-global");
    if(btnGlobal) {
        btnGlobal.disabled = true;
        btnGlobal.innerText = "GUARDANDO... ⏳";
    }

    const peticiones = [];

    tarjetas.forEach(tarjeta => {
        const partidoId = tarjeta.getAttribute("data-partido-id");
        const inputLocal = tarjeta.querySelector(".input-goles-local");
        const inputVisitante = tarjeta.querySelector(".input-goles-visitante");

        if (inputLocal && inputVisitante) {
            const golesLocal = parseInt(inputLocal.value) || 0;
            const golesVisitante = parseInt(inputVisitante.value) || 0;

            const p = fetch(`${BASE_URL}/predicciones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuarioId: usuarioId,
                    partidoId: partidoId,
                    golesLocalVoto: golesLocal,
                    golesVisitanteVoto: golesVisitante
                })
            });
            peticiones.push(p);
        }
    });

    try {
        const respuestas = await Promise.all(peticiones);
        const todoOk = respuestas.every(res => res.ok);

        if (todoOk) {
            alert("✅ ¡Todas tus predicciones de la fecha se guardaron con éxito! 🏆");
            cargarTableroPartidos(); 
        } else {
            alert("⚠️ Algunas predicciones no se pudieron procesar bien. Revisá e intentalo de nuevo.");
        }
    } catch (error) {
        console.error("Error al guardar predicciones globales:", error);
        alert("Hubo un problema de red al intentar mandar los pronósticos.");
    } finally {
        if(btnGlobal) {
            btnGlobal.disabled = false;
            btnGlobal.innerText = "GUARDAR PREDICCIÓN 💾";
        }
    }
}

// 🌐 FLUJO DE GOOGLE AUTH VIA SUPABASE
function iniciarSesionConGoogle(e) {
    e.preventDefault();
    console.log("Redirigiendo a Google Auth...");
    
    // Feedback visual en el botón de Google que fue presionado
    const btnPresionado = e.currentTarget;
    if (btnPresionado) {
        btnPresionado.disabled = true;
        btnPresionado.innerText = "Conectando a Google... ⏳";
    }
    
    const SUPABASE_PROJECT_URL = "https://qtabvayxldwetjxgrqqm.supabase.co"; 
    const SUPABASE_ANON_KEY = "sb_publishable_zF0BeJb0jnfVB3zUMytneQ_oZK04Il9"; 
    const redirectUrl = window.location.origin; 
    
    window.location.href = `${SUPABASE_PROJECT_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&apikey=${SUPABASE_ANON_KEY}`;
}

// 4. CONTROLADOR DE PERSISTENCIA (FIX F5)
function verificarSesionExistente() {
    const usuarioGuardado = localStorage.getItem("usuarioProde");

    if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado); 
        
        if (document.getElementById("nombre-usuario-header")) {
            document.getElementById("nombre-usuario-header").innerText = usuario.nombre;
        }
        
        document.getElementById("pantalla-login").style.display = "none";
        document.getElementById("pantalla-juego").style.display = "block";
        cargarTableroPartidos();
    } else {
        // Al arrancar sin sesión, aseguramos ver los botones iniciales limpios
        document.getElementById("pantalla-login").style.display = "flex";
        document.getElementById("bloque-opciones-iniciales").style.display = "flex";
        document.getElementById("vista-login").style.display = "none";
        document.getElementById("vista-registro").style.display = "none";
        document.getElementById("pantalla-juego").style.display = "none";
    }
}

function configurarPestañas() {
    const botonesPestañas = document.querySelectorAll(".tab-btn");
    // Buscamos el contenedor principal de las secciones
    const mainContenedor = document.querySelector("main.contenedor");

    botonesPestañas.forEach(boton => {
        boton.addEventListener("click", (e) => {
            e.preventDefault();
            const pestañaSeleccionada = boton.getAttribute("data-tab");
            
            // 1. Limpieza visual de botones superiores
            botonesPestañas.forEach(b => b.classList.remove("active"));
            boton.classList.add("active");

            // 🌟 TRUCO CLAVE: Guardamos la pestaña actual en el HTML al instante del clic.
            // Esto evita cualquier tipo de parpadeo visual porque el CSS reacciona en 0 milisegundos.
            if (mainContenedor) {
                mainContenedor.setAttribute("data-vista-activa", pestañaSeleccionada);
            }

            // 2. Limpieza total de los contenedores para recibir la nueva data
            const contenedorPrincipal = document.getElementById("contenedor-partidos"); 
            if (contenedorPrincipal) contenedorPrincipal.innerHTML = "";
            
            const contGrupos = document.getElementById("contenedor-grupos");
            const contPartidosInicio = document.getElementById("lista-partidos-en-vivo");
            if (contGrupos) contGrupos.innerHTML = "";
            if (contPartidosInicio) contPartidosInicio.innerHTML = "";

            // 3. Lógica de carga de datos
            pestañaActiva = pestañaSeleccionada;
            if (pestañaActiva === "inicio") {
                cargarDashboardInicio();
            } else {
                cargarTableroPartidos();
            }
        });
    });
}

// Función para cargar los datos del dashboard
async function cargarDashboardInicio() {
    document.body.classList.add("vista-inicio");
    // 1. Ocultar el botón apenas entramos a Inicio (así no dependemos de dónde venía el usuario)
    const botonGuardar = document.getElementById("btn-guardar-prediccion");
    if (botonGuardar) {
        botonGuardar.style.display = "none";
    }
    const contenedorGrupos = document.getElementById("contenedor-grupos");
    
    // Ocultamos el botón de guardar predicción en la pestaña Inicio
    if (!contenedorGrupos) {
        console.warn("No se encontró el contenedor-grupos en el DOM.");
        return;
    }

    contenedorGrupos.innerHTML = "<p>Cargando Grupos del Mundial...</p>";

    try {
        // 1. Traemos todos los equipos de una sola vez
        const { data: equipos, error } = await db.from('Equipos').select('*');

        if (error) throw error;

        // 2. Definimos las letras de los 12 grupos (Del Grupo A al L)
        const letrasGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        
        // 3. Acá vamos a ir acumulando el HTML de todos los grupos
        //  AHORA DEJALO ASÍ:
let htmlDeTodosLosGrupos = `
    <div style="width: 100%; text-align: center; margin-bottom: 25px;">
        <h2 style="color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.6); font-size: 24px;">⚽ Grupos y Resultados en Vivo</h2>
    </div>
    
    <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; width: 100%;">
`;
        // 4. Recorremos letra por letra
        letrasGrupos.forEach(letra => {
            // Filtramos los equipos de la letra actual
            const equiposDelGrupo = equipos.filter(equipo => equipo.grupo === letra);

            // Si el grupo tiene equipos cargados, armamos su tarjetita
            if (equiposDelGrupo.length > 0) {
                htmlDeTodosLosGrupos += `
                    <div class="tarjeta-grupo" style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 260px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #e67e22; padding-bottom: 5px; text-align: center;">Grupo ${letra}</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                `;

                // Metemos los 4 equipos de este grupo en particular
                equiposDelGrupo.forEach(equipo => {
                    htmlDeTodosLosGrupos += `
                        <li style="display: flex; align-items: center; margin-bottom: 10px;">
                            <img src="${equipo.logo_url || 'https://via.placeholder.com/30'}" alt="${equipo.nombre}" style="width: 30px; height: 30px; margin-right: 10px; object-fit: contain;">
                            <span style="font-weight: 500; color: #333;">${equipo.nombre}</span>
                        </li>
                    `;
                });

                htmlDeTodosLosGrupos += `
                        </ul>
                    </div>
                `;
            }
        });

        htmlDeTodosLosGrupos += `</div>`;

        // 5. Metemos todo el bloque gigante de grupos en la pantalla
        contenedorGrupos.innerHTML = htmlDeTodosLosGrupos;

    } catch (e) {
        console.error("Error detallado al cargar Inicio:", e);
        contenedorGrupos.innerHTML = `<p style="color:red;">Error al cargar datos: ${e.message}</p>`;
    }
}

function cargarFecha(numeroFecha) {
    const contenedor = document.getElementById("vista-fecha");
    
    // Aquí sí inyectas el botón, porque en las fechas sí quieres guardar
    contenedor.innerHTML = `
        <h2>Resultados Fecha ${numeroFecha}</h2>
        <div id="lista-partidos">...</div>
        
        <div class="contenedor-boton-global">
            <button id="btn-guardar" class="btn-guardar-global">
                GUARDAR PREDICCIÓN 💾
            </button>
        </div>
    `;
    
    // Aquí asocias el evento al botón
    document.getElementById("btn-guardar").addEventListener("click", guardarResultados);
}

// Función inteligente para mostrar el botón de guardar
function mostrarBotonGuardar() {
    // Si el usuario se movió a Inicio, bloqueamos el botón por completo
    if (pestañaActiva === "inicio") {
        const btn = document.getElementById("btn-guardar-prediccion");
        if (btn) btn.style.display = "none";
        return;
    }
    
    // Si está en cualquier otra pestaña, sí lo mostramos
    const btn = document.getElementById("btn-guardar-prediccion");
    if (btn) btn.style.display = "block";
}

