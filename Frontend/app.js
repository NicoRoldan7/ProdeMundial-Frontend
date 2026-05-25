const BASE_URL = "https://prodemundial-k6gn.onrender.com/api";

// 🔑 CONFIGURÁ ACÁ TU USUARIO Y CONTRASEÑA PREDETERMINADOS:
const CREDENCIALES_VALIDAS = {
    usuario: "admin",
    clave: "prode2026"
};

// 🌟 VARIABLE GLOBAL: Guarda qué pestaña está mirando el usuario
let pestañaActiva = "inicio"; 

// 🚀 UNIFICADO: La carga inicial de la página configurando todo el Front
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando aplicación...");

    // 🔥 Inicializar los clics de las pestañas de una (afecta a PC y celular)
    configurarPestañas();

    // =========================================================================
    // 🌟 CAPTURAR DATOS DE GOOGLE CUANDO SE REDIRIGE DESDE SUPABASE
    // =========================================================================
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");
        
        if (accessToken) {
            console.log("¡Logueado con Google con éxito!");
            
            try {
                // Abrimos el token para sacar los datos reales de Google
                const tokenParts = accessToken.split('.');
                const userPayload = JSON.parse(atob(tokenParts[1]));
                
                // Sacamos el nombre real de tu cuenta de Google o un fallback por si falla
                const nombreReal = userPayload.user_metadata?.full_name || userPayload.user_metadata?.name || "Jugador Google";
                const uIdReal = userPayload.sub; // Tu GUID real de Supabase
                
                // Armamos el objeto unificado en usuarioProde para no mezclar claves
                const usuarioGoogle = { 
                    id: uIdReal, 
                    nombre: nombreReal 
                };
                
                localStorage.setItem("usuarioProde", JSON.stringify(usuarioGoogle));
            } catch (e) {
                console.error("Error al decodificar el token de Google:", e);
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
    
    // 🌟 Evento para el botón de Google
    const btnGoogle = document.getElementById("btn-google-register") || document.getElementById("btn-google-login");
    if (btnGoogle) {
        btnGoogle.addEventListener("click", iniciarSesionConGoogle);
    }
    
    // 🌟 Evento para abrir/cerrar el menú de perfil (NO SE TOCA, QUEDA INDEPENDIENTE)
    const btnPerfil = document.getElementById("btn-perfil");
    if (btnPerfil) {
        btnPerfil.addEventListener("click", (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById("dropdown-perfil");
            if (dropdown) dropdown.classList.toggle("show");
        });
    }

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
            }
        });
    }
    // =========================================================================
    
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
    const btnFechas = document.getElementById("btn-fechas-trigger");
    const dropdownFechas = document.getElementById("dropdown-fechas-contenido");

    if (btnFechas && dropdownFechas) {
        // Abrir y cerrar el menú de fechas al hacer click
        btnFechas.addEventListener("click", (e) => {
            e.stopPropagation(); // Evita que se cierre al instante
            dropdownFechas.classList.toggle("mostrar-fechas");
        });

        // Si hacen click en cualquier parte vacía de la pantalla, cerramos este menú
        window.addEventListener("click", () => {
            dropdownFechas.classList.remove("mostrar-fechas");
        });
    }
    // =========================================================================

    // =========================================================================
    // 📥 BOTÓN GLOBAL DE GUARDAR PREDICCIÓN (NUEVO)
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
// 🔄 1. SISTEMA DE CONTROL DE ACCESO (CORREGIDO PARA TU LOGIN DTO)
// =========================================================================
function configurarLogin() {
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const userInput = document.getElementById("login-user").value.trim();
        const passInput = document.getElementById("login-pass").value.trim();

        // Bypass de administrador local rápido
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
            const res = await fetch(`${BASE_URL}/usuarios/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // 🔥 ¡REEMPLAZADO! Cambiamos "email" por "inputUsuario" para que calce con tu LoginDTO de C#
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
        }
    });
}

function configurarNavegacionLogin() {
    const linkRegistro = document.getElementById("link-ir-a-registro");
    const linkLogin = document.getElementById("link-ir-a-login");
    const vistaLogin = document.getElementById("vista-login");
    const vistaRegistro = document.getElementById("vista-registro");

    if(linkRegistro && vistaLogin && vistaRegistro) {
        linkRegistro.addEventListener("click", (e) => {
            e.preventDefault();
            vistaLogin.style.display = "none";
            vistaRegistro.style.display = "block";
        });
    }

    if(linkLogin && vistaLogin && vistaRegistro) {
        linkLogin.addEventListener("click", (e) => {
            e.preventDefault();
            vistaRegistro.style.display = "none";
            vistaLogin.style.display = "block";
        });
    }
}

// =========================================================================
// 🔄 CONFIGURACIÓN DEL REGISTRO (MODIFICADO CON NUEVOS CAMPOS)
// =========================================================================
function configurarRegistro() {
    document.getElementById("form-registro").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nuevoNombre = document.getElementById("reg-user").value.trim();
        const nuevoUsername = document.getElementById("reg-username").value.trim(); // NUEVO: Captura el alias
        const nuevoEmail = document.getElementById("reg-email").value.trim();
        const nuevaPass = document.getElementById("reg-pass").value.trim();

        if (!nuevoNombre || !nuevoUsername || !nuevoEmail || !nuevaPass) {
            alert("⚠️ Por favor, completa todos los campos del formulario.");
            return;
        }

        try {
            // Mandamos los campos estructurados hacia la API de Render
            const res = await fetch(`${BASE_URL}/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: nuevoNombre,
                    username: nuevoUsername, // Agregado al payload del backend
                    email: nuevoEmail,
                    password: nuevaPass
                })
            });

            if (res.ok) {
                alert(`🎯 ¡Usuario "${nuevoUsername}" creado con éxito!\nYa podés ingresar usando tu usuario y contraseña.`);
                document.getElementById("form-registro").reset();
                document.getElementById("link-ir-a-login").click(); 
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

function cerrarSesion() {
    localStorage.removeItem("usuarioProde");
    document.getElementById("form-login").reset();
    document.getElementById("pantalla-juego").style.display = "none";
    document.getElementById("pantalla-login").style.display = "flex";
    document.getElementById("contenedor-partidos").innerHTML = "";
    
    document.getElementById("vista-registro").style.display = "none";
    document.getElementById("vista-login").style.display = "block";
}

// 2. DIBUJAR EL FIXTURE FILTRADO POR PESTAÑAS (Modificado para remover botones individuales)
async function cargarTableroPartidos() {
    const contenedor = document.getElementById("contenedor-partidos");
    const btnGlobalContainer = document.querySelector(".contenedor-boton-global");
    const usuarioGuardado = localStorage.getItem("usuarioProde");
    if (!usuarioGuardado) return;
    
    const usuario = JSON.parse(usuarioGuardado);
    const usuarioId = usuario.id || 1; 

    // Ocultar botón global en secciones que no corresponden a fechas de juego
    if (btnGlobalContainer) btnGlobalContainer.style.display = "none";

    if (pestañaActiva === "general") {
        contenedor.innerHTML = `
            <div class="tarjeta-formulario" style="text-align: center; color: white;">
                <h2>📊 Tabla de Posiciones Generales</h2>
                <p>Acá va a ir la tabla con los puntajes acumulados de todos los pibes de la app.</p>
            </div>`;
        return;
    }

    if (pestañaActiva === "inicio") {
        contenedor.innerHTML = `
            <div class="tarjeta-formulario" style="text-align: center; color: white; padding: 2rem;">
                <h2>⚽ ¡Bienvenido al Prode Mundial 2026!</h2>
                <p>Seleccioná cualquiera de las fechas arriba en la barra para empezar a tirar tus pronósticos.</p>
            </div>`;
        return;
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

        // 💡 Tus GUIDs de la Base de Datos para filtrar partidos por ID de fecha
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

        // Si hay partidos para pronosticar, mostramos el botón de guardar abajo de todo
        if (btnGlobalContainer) btnGlobalContainer.style.display = "flex";

        partidosFiltrados.forEach(partido => {
            const local = mapaEquipos[partido.localId] || { nombre: "Local", logoUrl: "" };
            const visitante = mapaEquipos[partido.visitanteId] || { nombre: "Visitante", logoUrl: "" };

            const jugadaExistente = mapaPredicciones[partido.id]; 
            const golesLocalDefault = jugadaExistente ? jugadaExistente.golesLocalVoto : 0;
            const golesVisitanteDefault = jugadaExistente ? jugadaExistente.golesVisitanteVoto : 0;

            const fila = document.createElement("div");
            fila.className = "tarjeta-formulario";
            fila.setAttribute("data-partido-id", partido.id); // Identificador clave para juntar los datos
            fila.style = "margin-bottom: 16px;"; 
            
            // Renderizado limpito sin el bloque-accion de cada tarjeta
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

// 3. NUEVA FUNCIÓN GLOBAL: JUNTA TODO EL FIXTURE Y GUARDA LA FECHA COMPLETA EN LA API
async function guardarPrediccionGlobal() {
    const usuarioGuardado = localStorage.getItem("usuarioProde");
    if (!usuarioGuardado) {
        alert("⚠️ No se detectó una sesión activa. Volvé a ingresar.");
        return;
    }
    
    const usuario = JSON.parse(usuarioGuardado);
    const usuarioId = usuario.id;

    // Buscamos todas las tarjetas de partidos renderizadas actualmente
    const tarjetas = document.querySelectorAll(".tarjeta-formulario[data-partido-id]");
    
    if (tarjetas.length === 0) {
        alert("No hay partidos para guardar.");
        return;
    }

    // Desactivamos el botón temporalmente para que no hagan doble click furioso
    const btnGlobal = document.getElementById("btn-guardar-prediccion-global");
    if(btnGlobal) {
        btnGlobal.disabled = true;
        btnGlobal.innerText = "GUARDANDO... ⏳";
    }

    const peticiones = [];

    // Barremos cada tarjeta, sacamos los goles ingresados y preparamos las llamadas fetch
    tarjetas.forEach(tarjeta => {
        const partidoId = tarjeta.getAttribute("data-partido-id");
        const inputLocal = tarjeta.querySelector(".input-goles-local");
        const inputVisitante = tarjeta.querySelector(".input-goles-visitante");

        if (inputLocal && inputVisitante) {
            const golesLocal = parseInt(inputLocal.value) || 0;
            const golesVisitante = parseInt(inputVisitante.value) || 0;

            // Agregamos la promesa al array
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
        // Disparamos todos los fetch juntos en paralelo para máxima velocidad
        const respuestas = await Promise.all(peticiones);
        
        // Verificamos si al menos todas las respuestas volvieron con estado OK
        const todoOk = respuestas.every(res => res.ok);

        if (todoOk) {
            alert("✅ ¡Todas tus predicciones de la fecha se guardaron con éxito! 🏆");
            cargarTableroPartidos(); // Recargamos para refrescar datos limpios
        } else {
            alert("⚠️ Algunas predicciones no se pudieron procesar bien. Revisá e intentalo de nuevo.");
        }
    } catch (error) {
        console.error("Error al guardar predicciones globales:", error);
        alert("Hubo un problema de red al intentar mandar los pronósticos.");
    } finally {
        // Volvemos el botón a la normalidad pase lo que pase
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
        document.getElementById("pantalla-login").style.display = "flex";
        document.getElementById("pantalla-juego").style.display = "none";
    }
}

// 5. ESCUCHADOR DE CLICS EN LAS PESTAÑAS (SINCRONIZADO PARA AMBAS VERSIONES)
function configurarPestañas() {
    const botonesPestañas = document.querySelectorAll(".tab-btn");
    const textoFechaActiva = document.getElementById("texto-fecha-activa");
    const dropdownFechas = document.getElementById("dropdown-fechas-contenido");

    console.log(`🔎 Buscando pestañas... Se encontraron: ${botonesPestañas.length} botones.`);

    if (botonesPestañas.length === 0) {
        return;
    }

    botonesPestañas.forEach(boton => {
        boton.addEventListener("click", (e) => {
            e.preventDefault();

            const pestañaSeleccionada = boton.getAttribute("data-tab");
            console.log(`🖱️ Clic detectado físicamente en la pestaña: ${pestañaSeleccionada}`);
            
            if (!pestañaSeleccionada) return;

            pestañaActiva = pestañaSeleccionada;

            // Buscamos TODOS los botones con ese mismo data-tab (el de PC y el de Celu) y los activamos juntos
            botonesPestañas.forEach(b => {
                if (b.getAttribute("data-tab") === pestañaSeleccionada) {
                    b.classList.add("active");
                } else {
                    b.classList.remove("active");
                }
            });

            // 📱 SI ESTAMOS EN CELULAR: Actualiza el texto del desplegable y lo cierra
            if (textoFechaActiva && dropdownFechas) {
                textoFechaActiva.innerText = boton.innerText; // Setea el nombre, ej: "Fecha 1"
                dropdownFechas.classList.remove("mostrar-fechas"); // Esconde la cajita
            }

            console.log(`🎯 Cambiando visualmente a la pestaña: ${pestañaActiva}`);
            cargarTableroPartidos();
        });
    });
}