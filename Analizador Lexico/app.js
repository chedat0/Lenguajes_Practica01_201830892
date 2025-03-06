//Variables globales, para llamar a los id desde html y generar END POINTS
let ingresarTexto = document.getElementById('ingresarTexto');
let cargarArchivo = document.getElementById('cargarArchivo');
let reporteErrores = document.getElementById('reporteErrores');
let reporteTokens = document.getElementById('reporteTokens');
let conteoLexemas = document.getElementById('conteoLexemas');
let mostrarResultados = document.getElementById('mostrarResultados');

//Evento para boton de cargar archivo
cargarArchivo.addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            ingresarTexto.value = e.target.result;
        };
        reader.readAsText(file);
    }
});

//Funcion para limpiar texto
function limpiarTexto() {
    ingresarTexto.value = '';
    cargarArchivo.value = '';
    buscarPatron.value = '';
    reporteErrores.innerHTML = '';
    reporteTokens.innerHTML = '';    
    conteoLexemas.innerHTML = '';
    mostrarResultados.innerHTML = '';
}


//Funcion para analizar texto
function analizarTexto() {
    let texto = ingresarTexto.value;
    let linea = texto.split('\n');
    let errores = [];
    let tokens = [];
    let lexemas = {};

    for (let i = 0; i < linea.length; i++) {
        let line = linea[i];
        let columna = 0;

        while (columna < line.length) {
            let char = line[columna];

            //No se toman en cuenta los espacios en blanco
            if (char === ' ' || char === '\t') {
                columna++;
                continue;
            }

            // Se Identifican los tokens
            if (esLetra(char)) {
                // El token es un identificador
                let token = esIdentificador(line, columna);
                tokens.push({ token: 'Identificador', lexema: token.lexema, line: i + 1, columna: columna + 1 });
                lexemas[token.lexema] = (lexemas[token.lexema] || 0) + 1;
                columna += token.length;
            } else if (esDigito(char)) {
                // El token es un número o decimal
                let token = verificarNumero(line, columna);
                if (token.type === 'Número Entero') {
                    tokens.push({ token: 'Número Entero', lexema: token.lexema, line: i + 1, columna: columna + 1 });
                } else {
                    tokens.push({ token: 'Decimal', lexema: token.lexema, line: i + 1, columna: columna + 1 });
                }
                lexemas[token.lexema] = (lexemas[token.lexema] || 0) + 1;
                columna += token.length;
            } else if (esSimbolo(char)) {
                // El token es un símbolo de los tipos operadores, puntuación o agrupación
                let token = tipoSimbolo(line, columna);
                if (token.type) {
                    tokens.push({ token: token.type, lexema: token.lexema, line: i + 1, columna: columna + 1 });
                    lexemas[token.lexema] = (lexemas[token.lexema] || 0) + 1;
                    columna += token.length;
                } else {
                    errores.push({ simbolo: char, line: i + 1, columna: columna + 1 });
                    columna++;
                }
            } else {
                //Si el carácter no forma parte del lenguaje que se indica entonces se reporta como error.
                errores.push({ simbolo: char, line: i + 1, columna: columna + 1 });
                columna++;
            }
        }
    }

    if (errores.length > 0) {
        generarReporteErrores(errores);
    } else {
        generarReporteToken(tokens);
        generarConteoLexemas(lexemas);
    }
}
// Funciones para verificar tipos de caracteres que pertenece a cada tipo de token
function esLetra(char) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}

function esDigito(char) {
    return char >= '0' && char <= '9';
}

function esSimbolo(char) {
    const simbolos = ['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '(', ')', '[', ']', '{', '}', '.', ',', ';', ':'];
    return simbolos.includes(char);
}

// Función para saber si un token es identificador
function esIdentificador(line, inicio) {
    let lexema = '';
    let i = inicio;
    while (i < line.length && (esLetra(line[i]) || esDigito(line[i]))) {
        lexema += line[i];
        i++;
    }
    return { lexema: lexema, length: lexema.length };
}

// Función para saber si un token es número entero o decimal
function verificarNumero(line, inicio) {
    let lexema = '';
    let i = inicio;
    let esDecimal = false;

    while (i < line.length && (esDigito(line[i]) || line[i] === '.')) {
        if (line[i] === '.') {
            if (esDecimal) break; // Solo se permite un punto para verificar si es decimal
            esDecimal = true;
        }
        lexema += line[i];
        i++;
    }

    return {
        lexema: lexema,
        length: lexema.length,
        type: esDecimal ? 'Decimal' : 'Número Entero'
    };
}

// Funcion para saber el tipo de simbolo al que pertenece el token
function tipoSimbolo(line, inicio) {
    let char = line[inicio];
    let nextChar = line[inicio + 1];
    let lexema = char;
    let type = null;

    switch (char) {
        case '<':
        case '>':
        case '=':
        case '!':
            if (nextChar === '=') {
                lexema += nextChar;
                type = 'Operador Relacional';
            } else if (char === '=') {
                type = 'Operador de Asignación';
            } else {
                type = 'Operador Relacional';
            }
            break;

        case '&':
        case '|':
            if (nextChar === char) {
                lexema += nextChar;
                type = 'Operador Lógico';
            }
            break;

        case '+':
        case '-':
        case '*':
        case '/':
        case '%':
            type = 'Operador Aritmético';
            break;

        case '(':
        case ')':
        case '[':
        case ']':
        case '{':
        case '}':
            type = 'Agrupación';
            break;

        case '.':
        case ',':
        case ';':
        case ':':
            type = 'Puntuación';
            break;

        default:            
            break;
    }

    return {
        lexema: lexema,
        length: lexema.length,
        type: type
    };
}

//Funciones para poder generar reportes de errores,token y lexemas.

function generarReporteErrores(errores) {
    reporteErrores.innerHTML = '<tr><th>Símbolo</th><th>Fila</th><th>Columna</th></tr>';
    errores.forEach(error => {
        let fila = `<tr><td>${error.simbolo}</td><td>${error.line}</td><td>${error.columna}</td></tr>`;
        reporteErrores.innerHTML += fila;
    });
    reporteTokens.innerHTML = '';
    conteoLexemas.innerHTML = '';
}

function generarReporteToken(tokens) {
    reporteTokens.innerHTML = '<tr><th>Token</th><th>Lexema</th><th>Fila</th><th>Columna</th></tr>';
    tokens.forEach(token => {
        let fila = `<tr><td>${token.token}</td><td>${token.lexema}</td><td>${token.line}</td><td>${token.columna}</td></tr>`;
        reporteTokens.innerHTML += fila;
    });
    reporteErrores.innerHTML = '';
}

function generarConteoLexemas(lexemas) {
    conteoLexemas.innerHTML = '<tr><th>Lexema</th><th>Cantidad</th></tr>';
    for (let lexema in lexemas) {
        let fila = `<tr><td>${lexema}</td><td>${lexemas[lexema]}</td></tr>`;
        conteoLexemas.innerHTML += fila;
    }
}

//Funcion para buscar patrones
function buscarPatron() {
    let patron = document.getElementById('buscarPatron').value;
    let texto = ingresarTexto.value;

    //En caso de que el buscador de patron esté vacío no realiza ninguna accion
    if (patron.length === 0) {
        mostrarResultados.innerHTML = "<p>Ingrese un patrón para buscar.</p>";
        return;
    }

    
    let linea = texto.split('\n');
    let cont = 0;    
    let textoSubrayado = '';

    for (let i = 0; i < linea.length; i++) {
        let line = linea[i];
        let lineaResaltada = '';
        let j = 0;        
        // Procesar cada línea caractér por caractér
        while (j < line.length) {
            if (j <= line.length - patron.length) {                
                let encontrado = true;
                for (let pos = 0; k < patron.length; k++) {
                    if (line[j + pos] !== patron[pos]) {
                        encontrado = false;
                        break;
                    }
                }
                
                if (encontrado) {                    
                    lineaResaltada += '<span style="background-color: gray;">' + patron + '</span>';
                    cont++;
                    j += patron.length;
                    continue;
                }
            }
            
            // Si no hay coincidencia, añadimos el carácter actual
            lineaResaltada += line[j];
            j++;
        }        
        // Añadimos la línea procesada al resultado, preservando la estructura original
        textoSubrayado += '<div>' + lineaResaltada + '</div>';
    }    
    // Mostrar resultados
    let resultHTML = `<p><strong>Patron buscado:</strong> ${patron}</p>`;
    resultHTML += `<p><strong>No. Repeticiones:</strong> ${cont} veces</p>`;
    resultHTML += `<div><strong>Texto resaltado:</strong><br>${textoSubrayado}</div>`;

    mostrarResultados.innerHTML = resultHTML;
}

//Funcion para guardar y descargar el texto de entrada

function guardarTexto() {
    let texto = ingresarTexto.value;
    let blob = new Blob([texto], { type: 'text/plain' });  //Permite la descarga del archivo editado o generado en el editor de texto
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'texto_analizado_correctamente.txt';
    a.click();
    URL.revokeObjectURL(url);
}