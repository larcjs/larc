# Foreword

*by Christopher Robison*

I didn't set out to build a framework. I set out to escape one — or at least escape the gravitational pull of the endless build pipeline.

After decades of building things for the web, my machine had become a storage exhibit of Node versions, Python versions, shims, wrappers, and dependency folders with the mass of small moons. Not because any of it was bad. Build tools are fine. For big projects, they're downright amazing. But somewhere along the way, we normalized the idea that even the simplest experiment needed a pipeline, a bundler, a transpiler, and a twelve-step hydration ritual before it could say "Hello, World."

That friction bothered me.

I wanted the feeling I had back in the early days: the joy of dropping a `<script>` tag into an HTML file and instantly seeing something come alive. No ceremony. No yak shaving. Just a browser, a file, and an idea.

Web Components felt close to that spirit — native modules, shadow DOM, real encapsulation — but they were oddly isolated. Each component was a self-contained island. Reusable, yes. Architecturally composable? Not really. Nothing tied them together except whatever glue code you wrote yourself. It felt like someone had shipped LEGO bricks without the ability to click them together.

That's when I remembered the CAN bus in cars.

The CAN bus is this beautifully simple ecosystem: dozens of systems — sensors, motors, controllers — all sharing a single communication line. Anybody can broadcast. Anybody can listen. Nobody needs to know who else exists. A message goes out, and the parts that care respond. It's loosely coupled machinery at its finest.

I wanted that for the web.

So I built the PAN bus — the Page Area Network — and started experimenting. Not with the intention of making A Real Framework™, but out of curiosity. How far could I push this idea? What could I build if every component on the page could talk over a shared bus, using nothing but browser-native APIs and one tiny script include?

That little experiment got out of hand in the best way.

I kept pushing it, partly out of stubbornness, partly out of sheer delight. I wanted to see if I could build real, full-blown applications with no build process at all — just a single script tag pointing to LARC and a page full of components chatting over the bus. And it turned out to be… fun. Refreshing. Capable. Liberating, even. A loose, elegant architecture emerged almost on its own.

Along the way, I realized something important: I'm not anti-build-tool. They solve real problems, especially at scale. But they shouldn't be mandatory for everything. And they shouldn't overshadow the fact that the browser today is powerful enough to build serious applications with a simple HTML page, a few components, and a shared message bus.

React, Angular, Vue — they solved problems that absolutely needed solving at the time. The web platform in 2015 was missing big pieces: templating, reactivity, routing, structured components, coherence. These frameworks carried the industry through that era. But the web has evolved since then. Many of those features now exist natively — standardized, built-in, fast, and universally available.

LARC isn't here to replace those frameworks. It complements them. It fills in the 20% Web Components never standardized — the shared communication fabric. The glue that lets components coexist instead of siloing themselves off. It also makes bundle sizes smaller and architectures cleaner, whether you're going framework-free or integrating with your existing stack.

If this book succeeds, you'll see what I saw: the thrill of rediscovering the browser as a first-class app platform. The joy of building big things out of small, decoupled pieces. And the surprising power of an architecture that starts with a simple HTML file and one script include.

The web grew up. Now we get to build like it.

— *Christopher Robison*
