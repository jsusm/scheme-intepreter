import { useEffect } from "react";
import { hightlightCode } from "../lib/hightlightCode";
import { NotebookEditor } from "./NotebookEditor";
import { ScrollArea } from "@base-ui-components/react/scroll-area"
import { marked, type RendererObject, type TokenizerAndRendererExtension } from "marked"

const content = `
# (Tutorial of my flavour of Scheme)

Hola, en esta guía aprenderás Scheme, a tu derecha tienes un editor de código por bloques en el que puedes
escribir código y ejecutarlo, puedes crear más bloque de código y ejecutarlos por separado, las variables y
funciones que declares se compartirán entre los bloques de código, trata de seguí la guía escribiendo los
bloques de código por tí mismo.


Scheme surgió en la década de 1970 en el Laboratorio de Inteligencia Artificial
del MIT, creado por Guy L. Steele Jr. y Gerald Jay Sussman. Es un dialecto de
Lisp, una de las familias de lenguajes de programación más antiguas. Si bien
comparte la sintaxis característica de Lisp, basada en paréntesis (conocida como
expresiones S o expresiones simbólicas), Scheme fue diseñado con un núcleo mucho
más pequeño y sencillo.

Scheme es un lenguaje minimalista, familia del lenguaje Lisp, que con pocas
reglas para formar expresiones soporta varios paradigmas de programación que 
usamos hoy en día.

## (Tipos de datos)

Para crear programas necesitamos representar la información de alguna forma, esta
implementación de Scheme soporta

**Números**: \`123 3.14 -31\` (números reales)

**Booleanos**: \`#t\` (para representar un valor verdadero) \`#f\` (para un valor falso)

**Symbolos**: \`Hello asf +>\` (nombre de variables funciones o identificadores en general, scheme brinda una gran flexibilidad para usar cadenas de caracteres como identificadores)

**Cadenas de texto**: \`"Hi"\` (las cadenas de texto deben ir en comillas dobles, las comillas simples tienen otro propósito)

También soporta listas, pero lo veremos más adelante.

~[Ejercicio][escribe algún dato en el editor y ejecuta el código]
~*[Ejercicio][escribe algún dato en el editor y ejecuta el código]{(example asdf)}

Ahora bien, con estos datos queremos hacer cierto tipo de operaciones, para ello 
usamos expresiones que se escriben entre paréntesis, en scheme se usa la notación
de prefijo, por lo tanto el operador (o el nombre de la función) va al comienzo, 
por ejemplo si queremos sumar dos números escribimos la expresión, a los datos 
como números cadenas de texto, símbolos y booleanos también le llamamos
expresiones y son las expresiones más simples a estas expresiones simples les 
llamamos átomos.

\`\`\`
(+ 33 67)
\`\`\`

o si quisiéramos multiplicar dos números escribimos

\`\`\`
(* 13 4)
\`\`\`

Además las expresiones se pueden anidar por lo tanto

\`\`\`
(+ (* 5 9) (/ 12 4))
\`\`\`

es una expresión válida

En realidad, los operadores +, -, * son funciones que toman parámetros y producen 
un valor. En general, para llamar a una función, escribimos entre paréntesis el nombre 
de la función y luego los argumentos (función parámetro1 parámetro2 …)


~[Ejercicio][escribe una expresión que reste 18 - 8]
~[Ejercicio][escribe una expresión con expresiones anidadas]

## Variables
Normalmente queremos nombrar los datos, en lugar de referirnos a ellos literalmente,
para ello usamos variables, en scheme las variables se declaran con la forma especial 
define (las formas especiales son reglas o conceptos del lenguaje), por ejemplo si 
queremos declarar un variable PI lo haríamos de la siguiente forma

\`\`\`
(define PI 3.14)
\`\`\`

~[Ejercicio][Ejercicio, declara una variable nombre con el valor de tu nombre entre comillas \`""\`]

Para ver el valor de una variable la podemos escribir en el editor fuera de los paréntesis,
o podemos usar la función print, por lo tanto

\`\`\`
(define x 12345)
x
(print x)
\`\`\`

este código imprimirá el valor de x (12345) dos veces

~[Ejercicio][Imprime el valor de la variable nombre que declaraste en el ejercicio anterior]

Ya vimos la función print, ¿qué hay de hacer nuestras propias funciones?, para ello 
también podemos usar define pero con otra sintaxis, si queremos crear la función 
suma la declararemos de la siguiente forma

\`\`\`
(define (suma a b) (+ a b))
\`\`\`
Por lo tanto, la sintaxis sería (define ( < nombre de la función > < argumentos >) <cuerpo 
de la función>), en el ejemplo anterior “suma” es el nombre de la función, los argumentos 
son “a b” y el cuerpo de la función es “(+ a b)”. Si quisiéramos ejecutar esta función 
lo haríamos de la siguiente forma

\`\`\`
(sum 3 4)
\`\`\`

~[Ejercicio][escribe la declaración de la función suma en el editor y ejecutala]
~[Ejercicio][escribe una función mult que tome dos argumentos y los multiplique]

también podemos declarar funciones usando la forma especial lambda, lambda crea una 
funcion y esta puede ser asignada a una simbolo

\`\`\`
(define (addOne n) (+ n 1))
(define addOne (lambda (n) (+ n 1)))
\`\`\`

En ambos casos addOne tendra el mismo contenido, puesto que la primera sentencia es una abreviatura de la segunda

~[Ejercicio][Declara una función double que devuelva el doble de un número usando lambda]


Si estás familiarizado con otros lenguajes basados en C notaras que en la función no hay un return, en Scheme la función retorna el valor de su última expresión por lo tanto la función

\`\`\`
(define (sumAndMult a b) (* a b) (+ a b))
\`\`\`

retornará la suma de a y b y no la multiplicacion de ambas

## Control de Flujo

Si queremos hacer algoritmos necesitamos estructuras de flujo de control, es decir 
if’s, evaluar expresiones de acuerdo a una condición usamos la forma especial if 
de la siguiente forma

\`\`\`
(if ({condicion}) ({entonces}) ({de_lo_contrario}))
\`\`\`

En inglés se lee un poco mejor que en español, basicamente si la condición es cierta 
se ejecuta la expresión que va después de la condición y si la condición es falsa 
se ejecuta la última condición, por lo tanto

\`\`\`
(if (= nombre “scheme”)
    (print “¿Te llamas scheme?”)
    (print “tu nombre es ” nombre)
)
\`\`\`

~[Ejercicio][ ejecuta el condicional anterior ]

También hay operadores lógicos como \`and\`, \`or\`, y funciones para comparar como \`>\` (mayor que) y \`<\` (menor que), 

~[Ejercicio][crear una función not que retorne el valor contrario un valor, si el 
argumento es falso retorna verdadero y si es verdadero, retorna falso, recuerda que 
un valor “verdadero” se representa como #t y un valor “falso” se representa como 
#f]

~[Ejercicio][Sabiendo que el operador \`>=\` (mayor o igual) lo podemos definir como 
la negación del operador \`<\` (menor que), es decir para dos número \`a\` y \`b\` si \`a >= 
b\` es lo mismo a decir que \`(not (< a b))\`, sabiendo esto crea una función \`>=\` con 
el operador \`<\` y la función del ejercicio anterior not]

# Recursividad

Ahora exploremos un poco la recursividad, La recursividad es uno de los aspectos 
más importantes de scheme, la recursividad es la capacidad de las funciones para 
llamarse a sí mismas, para solventar un problema con un algoritmo recursivo debemos 
identificar un caso base, en el cual no llamaremos a la función, y un caso recursivo
, en el que llamaremos a la función, tomemos por ejemplo la función factorial, el 
caso base sería el factorial de 0 y/o el factorial de 1 que en ambos casos el resultado 
es 1, ahora para todo número n mayor que 1 de define el factorial como n * fac(n - 1),
por lo tanto este sería nuestro caso recursivo

~*[Desafio][Trata de implementar la función factorial]{
(define (fac n)
  (if (= n 1)
      1
      (* n (fac (- n 1)))
  )
)
}


~[Ejercicio][La exponenciacion la podemos definir como b<sup>n</sup> = b · b<sup>
n-1</sup> y b<sup>0</sup> = 1 , escribe la función \`exp\` que calcule b elevado 
a la n de forma recursiva]

~*[Desafio][El algoritmo de Euclides para obtener el maximo comun divisor de dos
número se basa en la observación de, si r es el remanente de la división entre a 
y b, el MCD de a y b es igual al MCD entre b y r, siendo a mayor o igual a b. Por 
lo tanto 
\`\`\`
MCD(40, 6) = MCD(6, 4)
		= MCD(4, 2)
 		= MCD(2, 0) = 2
\`\`\`
Así siempre nos quedará un b = 0 y en ese caso el MCD será a. Léelo dos veces y trata 
de implementar o pensar en una solución antes de ver la respuesta]{


;;esta solución asume que a es mayor que b
(define (MCD a b)
	(if (= b 0)
        a
 	    (MCD b (% a b))
	)
)

}



~[Ejercicio][Sabiendo que podemos definir la serie de Fibonacci como \`fib(n) = fib(n-1)+
fib(n-2)\` y que \`fib(0) = 1\` y \`fib(1) = 1\`, puesto que los primeros dos números 
de la serie de fibonacci son 1. Crea una función \`fib\` que obtenga el número n de la 
serie de fibonacci de forma recursiva]


Con recursividad podemos expresar procedimientos iterativos,por ejemplo si queremos 
realizar una función que imprima los números desde el cero hasta n, lo podemos hacer 
con un bucle, pero no contamos con una forma especial para ello, podemos realizar 
lo mismo con recursión, en este caso podríamos definimos una función iter dentro 
de la función printNumbersTo

\`\`\`
(define (printNumbersTo n)
 (define (iter i)
   (if (= i n) (print n) (begin (print n) (iter (+ i 1))))
 )
 (iter 0)
)
\`\`\`

En si printNumbersTo esta haciendo un bucle, aumentando y en uno hasta que llega 
a n, imprimiendo los valores de i

Posiblemente notaste que definimos una función dentro de otra, esto es permitido 
por el lenguaje, en sí estamos declarando una variable con el valor de una función

Además puede ser que hayas visto la palabra begin, esta es una forma especial que 
te permite ejecutar secuencialmente varias expresiones, devolviendo el valor de la 
ultima expresion

## Funciones como parámetros

Veamos las siguientes funciones: 
la primera computa la suma de los números desde a hasta b

\`\`\`
(define (sum-integers a b)
 (if (> a b)
  0
  (+ a (sum-integers (+ a 1) b))
 )
)
\`\`\`

Esta computa la suma de los cubos de los números desde a hasta b
\`\`\`
(define (cube a) (* a a a))
(define (sum-cubes a b)
  (if (> a b)
   0
   (+ (cube a) (sum-cubes (+ a 1) b))
  )
)
\`\`\`

Esta computa la serie
\`(1 / (1 * 3)) + (1 / (5 * 7)) + (1 / (9 * 11)) + ...\`
que se aproxima lentamente a PI/8

\`\`\`
(define (pi-sum a b)
  (if (> a b)
      0
      (+ (/ 1.0 (* a (+ a 2))) (pi-sum (+ a 4) b))))

\`\`\`

Podemos observar que las tres funciones se parecen mucho, y en efecto las tres calculan 
la sumatoria de una serie en un intervalo, los matemáticos se dieron de cuenta de 
esta estructura y crearon la notación sigma para representarlo, en estos procedimientos 
notamos que son en su mayoría idénticos, lo que cambia es el nombre de la funcion,
la funcion para \`a\` que calcula el término a sumar, y la función que calcula el 
siguiente valor de \`a\`, por lo tanto podríamos crear las tres funciones anteriores si 
rellenamos los espacios en la siguiente plantilla
 
\`\`\`
(define ([name] a b)
  (if (> a b)
    0
    (+ ([term] a)
       ([name] ([next] a) b)
    )
  )
)
\`\`\`


Como diseñadores de programas nos gustaría implementar un procedimiento que represente 
el concepto de “sumatoria”, y en efecto lo podemos representar convirtiendo los huecos 
o espacios de la plantilla en parámetros

\`\`\`
(define (sum term a next b)
 (if (> a b)
  0
  (+ (term a)
     (sum term (next a) next b)
  )
 )
)
\`\`\`

el procedimiento sum toma el valor inferior y superior del intervalo a y b, además de los procedimientos term y next, podemos usar sum como cualquier otro procedimiento, por ejemplo para definir sum-cubes (con el procedimiento inc para obtener el siguiente valor de a que sería a+1)

\`\`\`
(define (inc n) (+ n 1))
(define (sum-cubes a b)
 (sum cube a inc b)
)
\`\`\`

así podemos calcular la suma de los primeros 10 cubos de los números naturales

\`\`\`
(sum-cubes 1 10)
3025
\`\`\`

con el procedimiento identity podemos definir sum-integers
\`\`\`
(define (identity x) x)
(define (sum-integers a b)
 (sum identity a inc b)
)
\`\`\`

de forma análoga podemos definir pi-sum

\`\`\`
(define (pi-sum a b)
 (define (term a)
  (/ 1.0 (* a (+ a 2)))
 )
 (define (next a) (+ a 4))
 (sum term a next b)
)
\`\`\`

~*[Ejercicio][calcula pi-sum desde 1 hasta 10000, y multiplica por 8, se acerca a pi?]{
(* 8 (pi-sum 1 10000))
}
`


export function Demo() {
  const renderer: RendererObject = {
    code({ text }) {
      const hightlightedCode = hightlightCode(text)

      return `<pre class="text-base"><code>${hightlightedCode}</code></pre>`;
    },
    codespan({ text }) {
      const hightlightedCode = hightlightCode(text)

      return `<code>${hightlightedCode}</code>`;
    }
  }

  const testExtension: TokenizerAndRendererExtension = {
    name: 'test',
    level: 'block',
    start(src) { return src.match(/\~\[/)?.index },
    tokenizer(src, _tokens) {
      const rule = /^~\[([^\n\]]+)\]\[([^\]]+)\]/
      const match = src.match(rule)
      if (match) {
        const token = {
          type: 'test',
          raw: match[0],
          title: match[1],
          desc: this.lexer.inlineTokens(match[2].trim())
        }
        return token
      }
    },
    renderer(token) {
      return (
        `<p class="p-2 border border-neutral-700 rounded-lg bg-neutral-800">
<span class="font-mono text-blue-400">${token.title}:</span> ${this.parser.parseInline(token.desc)}
</p>`
      )
    },
    childTokens: ['desc']
  }

  const testWithHintExtension: TokenizerAndRendererExtension = {
    name: 'testWithHint',
    level: 'block',
    start(src) { return src.match(/\~\*\[/)?.index },
    tokenizer(src, _tokens) {
      const rule = /^~\*\[([^\n\]]+)\]\[([^\]]+)\]\{([^}]+)\}/
      const match = src.match(rule)
      if (match) {
        const token = {
          type: 'testWithHint',
          raw: match[0],
          title: match[1],
          code: match[3].trim(),
          desc: this.lexer.inlineTokens(match[2].trim()),
        }
        return token
      }
    },
    renderer(token) {
      return (
        `<div class="p-2 border border-neutral-700 rounded-lg bg-neutral-800 testWithHint">
<p class="mt-0 mb-0">
<span class="font-mono text-blue-400">${token.title}:</span> ${this.parser.parseInline(token.desc)} <button class="font-mono font-medium text-blue-400 hover:text-blue-300 testWithHintToggle">[Show response]</button>
</p>
<pre class="mt-2 mb-0 testWithHintCode hidden"><code>${hightlightCode(token.code)}</code></pre>
</div>
`
      )
    },
    childTokens: ['desc']
  }


  useEffect(() => {
    const testWithHintElements = document.getElementsByClassName("testWithHint") as HTMLCollectionOf<HTMLDivElement>
    const buttonCallbacks: Array<{ button: HTMLButtonElement, cb: () => void }> = []
    for (const element of testWithHintElements) {
      const toggleButton = element.querySelector('.testWithHintToggle') as HTMLButtonElement | null
      const code = element.querySelector('.testWithHintCode') as HTMLPreElement | null
      const handleClick = () => {
        console.log(code)
        code?.classList.toggle('hidden')
      }
      if (toggleButton) {
        toggleButton?.addEventListener('click', handleClick)
        buttonCallbacks.push({ button: toggleButton, cb: handleClick })
      }
    }
    // TODO: Solve code duplication
    return () => {
      for (const b of buttonCallbacks) {
        b.button.removeEventListener('click', b.cb)
      }
    }
  }, [])

  marked.use({ renderer, extensions: [testExtension, testWithHintExtension] })
  const tutorialContent = marked.parse(content)
  console.log(tutorialContent)
  return (
    <div className="bg-neutral-950 min-h-screen text-white p-4 space-y-8 dark">
      <div className=" max-w-[1200px] mx-auto flex justify-between items-center">
        <h1 className="text-lg font-medium font-mono"><span className="text-red-200">(</span><span className="text-red-400">Scheme</span> Interpreter By Jesus Marcano<span className="text-red-200">)</span></h1>
        <div>
          <p className="font-mono font-medium">[ Hide Tutorial ]</p>
        </div>
      </div>
      <div className="grid grid-cols-2 justify-center gap-4 max-w-[1200px] mx-auto">
        <NotebookEditor />
        <div className="sticky top-4 h-min">
          <ScrollArea.Root className="bg-neutral-900 rounded-xl px-6 py-4 text-neutral-200 space-y-8 h-[90dvh]">
            <ScrollArea.Viewport className="h-full overscroll-contain rounded-md">
              <div
                className="mx-auto prose prose-stone dark:prose-invert prose-headings:font-mono prose-h1:font-medium"
                dangerouslySetInnerHTML={{ __html: tutorialContent }}
              />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="m-2 flex w-1 justify-center rounded bg-neutral-800 opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75 data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75">
              <ScrollArea.Thumb className="w-full rounded bg-neutral-500" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>
      </div>
    </div>
  );
}
