export type MissionId = 'ignition' | 'stack' | 'land' | 'crew' | 'constellation' | 'cadence' | 'catch' | 'bid'

export type CodexCat = 'History' | 'Vehicles' | 'Money' | 'Customers' | 'Rivals' | 'Rules'

export type CodexCard = {
  id: string
  cat: CodexCat
  title: string
  kid: string
  deep: string
}

export type Choice = {
  id: string
  label: string
  kid: string
  result: string
  cash: number
  trust: number
  users: number
  unlock?: string
}

export type Chapter = {
  id: string
  year: string
  title: string
  kid: string
  deep: string
  mission: MissionId
  missionHint: string
  building: string
  reward: { cash: number; value: number; boosters?: number }
  unlock: string[]
  decision?: {
    prompt: string
    kid: string
    deep: string
    a: Choice
    b: Choice
  }
}

export const CODEX: CodexCard[] = [
  {
    id: 'founding',
    cat: 'History',
    title: 'A company to make space cheap',
    kid: 'SpaceX started in 2002 because rockets cost way too much. The big idea: build them like cars, fly them again, and someday send people to Mars.',
    deep: 'Elon Musk founded Space Exploration Technologies after failing to buy cheap Russian ICBMs for a Mars greenhouse stunt. The bet was vertical integration — design engines, structures, and avionics in-house — plus software-style iteration. That is the opposite of the old aerospace model: huge prime contractors, cost-plus NASA deals, and expendable rockets.',
  },
  {
    id: 'falcon1',
    cat: 'History',
    title: 'Three crashes, then orbit',
    kid: 'The first rocket, Falcon 1, blew up three times. The fourth try, in 2008, made it to space. If that one had failed, SpaceX was probably done.',
    deep: 'Falcon 1 flights 1–3 (2006–2008) failed from a fuel leak, a harmonic oscillation, and a stage-separation collision. Musk has said he was down to leftover capital split with Tesla. Flight 4 reached orbit on 28 September 2008 from Kwajalein — the first privately funded liquid rocket to do so. NASA’s CRS award that December is widely credited with keeping the company alive.',
  },
  {
    id: 'cots',
    cat: 'Customers',
    title: 'NASA as the first big customer',
    kid: 'NASA paid SpaceX to learn how to haul cargo to the space station — but only if the rockets actually worked. No work, no money.',
    deep: 'COTS (Commercial Orbital Transportation Services) and then CRS (Commercial Resupply Services) were fixed-price milestone deals, not classic cost-plus. NASA bought a service, not a science project. SpaceX kept the intellectual property. That flipped the incentive: finish, fly, get paid. Gwynne Shotwell’s CRS negotiation is the commercial turning point.',
  },
  {
    id: 'costplus',
    cat: 'Money',
    title: 'Cost-plus vs fixed-price',
    kid: 'Old space deals paid a company whatever it spent, plus a bonus. New deals say: here’s the price, go deliver. Guess which one makes you faster.',
    deep: 'Cost-plus (cost + negotiated fee) rewards headcount and overruns — the Cold War / Shuttle-era default. Fixed-price commercial crew and cargo made SpaceX eat overruns and keep savings. That is why Falcon 9 could undercut Atlas V and Ariane so hard, and why Boeing’s Starliner struggled on a bigger Commercial Crew award.',
  },
  {
    id: 'vertical',
    cat: 'Money',
    title: 'Build it yourself',
    kid: 'Most rocket companies buy engines from someone else. SpaceX builds the engines, the computers, the tanks — almost the whole rocket — in its own factory.',
    deep: 'Vertical integration cuts supplier margin and, more important, cycle time. Merlin, Draco, SuperDraco, and Raptor were designed in-house. Avionics, friction-stir-welded tanks, and ground software too. The tradeoff is huge capex and the need to become good at many crafts. The payoff is a factory you can speed up like a production line, not a program office.',
  },
  {
    id: 'reuse',
    cat: 'Vehicles',
    title: 'Why landing the booster matters',
    kid: 'The fat bottom of the rocket is the expensive part. If you throw it in the ocean, every launch costs a fortune. If you land it, you can fly it again like an airplane.',
    deep: 'The first stage is most of Falcon 9’s hardware cost. Landing it (LZ-1 / LZ-2 or a droneship) turns a ~$60–70M vehicle into a flight whose marginal cost is propellant, a new second stage, fairings, and refurb. First landing: 21 Dec 2015. First orbital reflight: 2017. By the mid-2020s some boosters had flown twenty-plus times. That is the cost curve competitors still chase.',
  },
  {
    id: 'expend',
    cat: 'Money',
    title: 'Sometimes you still throw it away',
    kid: 'A landed booster carries less stuff to high orbits. For a super-heavy satellite, SpaceX will sometimes burn the booster up on purpose.',
    deep: 'Reuse has a performance tax: fuel and mass reserved for landing. GTO / escape / very heavy LEO missions may fly expendable or “<1 burn” recovery profiles. The business question is always: is the extra payload revenue bigger than the booster you are sacrificing? Cadence usually says no. National-security or one-off science sometimes says yes.',
  },
  {
    id: 'crew',
    cat: 'Customers',
    title: 'Americans, launched in America again',
    kid: 'For years NASA had to buy Russian Soyuz seats. In 2020 Crew Dragon flew NASA astronauts from Florida. That was a really big deal.',
    deep: 'After Shuttle retired in 2011, the US had no domestic crew vehicle. Commercial Crew (CCtCap, 2014) split awards: SpaceX ~$2.6B, Boeing ~$4.2B. Demo-2 (May 2020) restored US crew launch. Dragon also opened a private-astronaut market (Inspiration4, Axiom, Polaris). Human-rating is a certification business, not just a flying business — abort modes, debris, NASA insight.',
  },
  {
    id: 'starlink',
    cat: 'Money',
    title: 'The real money is internet',
    kid: 'Rockets are cool. The thing that actually pays for most of SpaceX now is Starlink — Wi-Fi from space for ships, planes, farms, and armies.',
    deep: 'Launch is a ~$10B-class world market. A global broadband network is much larger. Starlink is a vertically integrated ISP: SpaceX is its own biggest launch customer. Public 2025 figures put Starlink around $11B of roughly $15–19B company revenue — the cash engine. Consumer, maritime, aviation, enterprise, and government (Starshield) are different price/ARPU pools. The flywheel: cheap launch → more sats → more capacity → more subscribers → more capital for Starship.',
  },
  {
    id: 'selflaunch',
    cat: 'Money',
    title: 'SpaceX launches SpaceX',
    kid: 'A lot of Falcon 9 flights do not carry someone else’s satellite. They carry more Starlink. The rocket company is also the customer.',
    deep: 'By the mid-2020s a large majority of Falcon 9 missions were Starlink. That has two effects. One: cadence stays high even if commercial GEO comsats shrink. Two: outside satellite companies find Falcon booked years out and must look at Vulcan, New Glenn, Neutron, or ride-share leftovers. Owning demand is a moat and a political sore spot.',
  },
  {
    id: 'cadence',
    cat: 'Vehicles',
    title: 'Airport, not a parade',
    kid: 'Old rockets flew a few times a year. Falcon 9 flies multiple times a week. Fast is a superpower.',
    deep: 'Cadence is the hidden product. Pad teams, range coordination with the FAA and Space Force, booster turnaround, and fairing recovery let Falcon behave like an airline. More flights amortize the factory and the people. They also generate the reliability statistics national-security customers buy. Competitors can copy a booster sketch. Copying 150+ flights a year is another matter.',
  },
  {
    id: 'starship',
    cat: 'Vehicles',
    title: 'The steel giant',
    kid: 'Starship is the huge stainless-steel rocket meant to be fully reused — even the top half — and caught by the tower’s chopsticks.',
    deep: 'Starship + Super Heavy is a fully reusable two-stage methalox vehicle. Stainless is cheap, strong at cryo, and easy to weld in a Texas tent. Raptor (full-flow staged combustion) is the engine bet. Catching the booster (and later the ship) deletes landing legs and speeds turnaround. The business case: collapse $/kg enough to launch Starlink V3, HLS landers, and eventually Mars stacks. Until then it is a giant capital sink funded by Starlink and Falcon.',
  },
  {
    id: 'hls',
    cat: 'Customers',
    title: 'Moon taxi for NASA',
    kid: 'NASA hired Starship to land astronauts on the Moon for Artemis. That is a government job that also pays to invent Mars hardware.',
    deep: 'The Human Landing System award (Option A to SpaceX, later Option B to a Blue Origin-led team) is classic dual-source politics plus a fixed-price stretch goal. SpaceX bid a variant of the vehicle it already wanted to build. NASA gets a lander; SpaceX gets milestone cash and requirements that pull Starship toward human-rating. Delay risk is high; the strategic fit is almost unfairly good.',
  },
  {
    id: 'nssl',
    cat: 'Customers',
    title: 'Spies and the Space Force',
    kid: 'The US does not want only one company able to launch secret satellites. So the Space Force also pays rivals — even when SpaceX is cheaper.',
    deep: 'NSSL (National Security Space Launch) replaced EELV. Phase 2 split flights between ULA and SpaceX so the nation has two assured vendors. Price still matters, but so do orbits, security, and “assured access.” A cheap monopolist is a military risk. That is why Vulcan and New Glenn keep getting oxygen even after Falcon ate the commercial market.',
  },
  {
    id: 'ula',
    cat: 'Rivals',
    title: 'ULA: the old champion',
    kid: 'United Launch Alliance was the US military’s rocket team for years — Atlas and Delta, later Vulcan. Super safe, super expensive.',
    deep: 'ULA (Boeing + Lockheed, 2006) inherited Atlas V / Delta IV and a cost-plus culture. RD-180 engines created a Russia problem. Vulcan-Centaur (BE-4) is the replacement. ULA’s advantage is heritage and NSSL paperwork. Its disadvantage is cadence and price. SpaceX did not beat ULA in a slide deck. It beat them by flying so often the price gap became embarrassing.',
  },
  {
    id: 'blue',
    cat: 'Rivals',
    title: 'Blue Origin: the other billionaire',
    kid: 'Jeff Bezos’s company builds New Shepard (small hops) and New Glenn (a big orbital rocket). They move slower than SpaceX. They have a lot of money.',
    deep: 'Blue Origin is the strategic rival that can out-wait almost anyone. New Glenn is a heavy reusable first stage aimed at Amazon’s Project Kuiper as an anchor tenant — the same “launch your own constellation” trick. BE-4 also powers Vulcan, so Blue is a supplier and a competitor. The gap is operational: SpaceX already has the factory tempo Blue is still inventing.',
  },
  {
    id: 'rlab',
    cat: 'Rivals',
    title: 'Rocket Lab and the little guys',
    kid: 'Rocket Lab flies a small rocket called Electron a lot. They want a bigger one, Neutron, to chase Falcon-sized jobs.',
    deep: 'Dedicated smallsat launch (Electron, plus Firefly, ABL, etc.) is a real niche SpaceX rideshare also attacks. Neutron is Rocket Lab’s attempt to climb into medium-lift with partial reuse. Nobody has matched Falcon’s combination of price, reliability stats, and weekly cadence. The “next SpaceX” conversation is mostly about who can get to airport-like ops, not who can draw a pretty vehicle.',
  },
  {
    id: 'faa',
    cat: 'Rules',
    title: 'You still need a license',
    kid: 'You cannot just light a rocket. The FAA, the Space Force range, and environmental rules all have to say go. Paperwork can stop a flying machine.',
    deep: 'Launch licenses, experimental permits, environmental assessments (NEPA), and range safety are real production constraints. Starbase in particular became a political and legal bottleneck. A company that iterates hardware weekly still waits on federal process. That is now part of the competitive map: whoever staffs regulatory affairs well flies more.',
  },
  {
    id: 'insurance',
    cat: 'Rules',
    title: 'Insurance and the launch market',
    kid: 'Satellites cost hundreds of millions. If your rocket is new, insurance is expensive. If you have flown 100 times, insurance gets cheaper — and customers relax.',
    deep: 'Launch service agreements include payload fairing volume, orbit insertion accuracy, and liability. Insurers price reliability. Falcon 9’s flight count is a financial instrument. New vehicles (Vulcan, New Glenn, Starship, Neutron) pay a “new rocket tax” until they have a string of successes. This is why cadence is not just flex — it is a credit rating.',
  },
  {
    id: 'fairings',
    cat: 'Vehicles',
    title: 'Catch the clamshell too',
    kid: 'The nose cone that protects the satellite splits in half and used to splash. SpaceX started catching those pieces with boats so they can fly again.',
    deep: 'Fairings are expensive composites. Recovery (Ms. Tree / Ms. Chief, later ship catch attempts) is another reuse margin. It is also a symbol of the culture: if it costs money and falls in the ocean, someone is assigned to go get it. Combined with booster and Dragon reuse, Falcon is a mostly reusable system with an expendable second stage — the remaining cost hog Starship is meant to kill.',
  },
  {
    id: 'gwynne',
    cat: 'Customers',
    title: 'The deal-maker',
    kid: 'Gwynne Shotwell is the president. She is the person who sells launches to NASA, the military, and companies — and then makes the factory keep the promise.',
    deep: 'Musk sets destination (Mars, cadence, Starship). Shotwell runs the book of business: pricing, manifests, government relations, and “we will actually deliver.” Commercial space companies die when the founder story outruns the COO. SpaceX’s government trust is as much her product as Merlin is Tom Mueller’s.',
  },
  {
    id: 'starshield',
    cat: 'Customers',
    title: 'Starlink in uniform',
    kid: 'The same internet satellites, hardened and sold to the military, are called Starshield. Armies noticed they work when other radios do not.',
    deep: 'Ukraine made LEO broadband a battlefield observation. Starshield packages the stack for DoD/intel: different encryption, ground, and contracting. It is high-margin compared with consumer kits and politically sensitive (who controls the off switch). It also locks national-security demand into the same constellation factory that serves rural internet.',
  },
  {
    id: 'dtc',
    cat: 'Money',
    title: 'Phones that talk to satellites',
    kid: 'New Starlink satellites can ping ordinary cell phones. That is a whole new business: not a dish on your roof, just the phone in your pocket.',
    deep: 'Direct-to-cell partnerships with wireless carriers turn SpaceX into a wholesale network for SMS/SOS and later broadband-ish service. It is a different sales motion (carrier, not consumer kit) and a spectrum fight. If it works, ARPU multiplies without a truck roll. If it interferes, regulators become the boss fight.',
  },
  {
    id: 'kuiper',
    cat: 'Rivals',
    title: 'Amazon wants a sky internet too',
    kid: 'Amazon is building Project Kuiper, another giant satellite Wi-Fi net. They need rockets — including, awkwardly, some Falcon 9s.',
    deep: 'Kuiper is the clearest demand-side rival to Starlink. Amazon booked launches across ULA, Blue Origin, and even SpaceX because its own New Glenn was late. That booking is a case study: when you are not vertically integrated with a flying rocket, you rent from the company you are trying to beat. SpaceX collecting Kuiper checks while Starlink competes with Kuiper is peak industry irony.',
  },
  {
    id: 'china',
    cat: 'Rivals',
    title: 'The other cadence race',
    kid: 'China is launching a lot too, and building its own mega-constellations. Space is not just an American sport.',
    deep: 'CASC Long March, commercial Chinese small-launch, and planned LEO broadband nets are the state-backed peer competitor. Export controls (ITAR) split the market: SpaceX cannot just sell the same stack everywhere. Geopolitics is now a product feature — who owns the network a country depends on.',
  },
  {
    id: 'secondstage',
    cat: 'Vehicles',
    title: 'The leftover problem',
    kid: 'Falcon lands the booster. The skinny top stage still burns up. That leftover piece is why Starship wants to bring the whole vehicle home.',
    deep: 'An expendable upper stage caps how cheap Falcon can get and leaves debris / disposal work. Starship’s ship is the upper stage and the payload bay and the crew cabin. Full reuse is the only way to the “airline” cost structure Musk talks about. Until Starship is operational, Falcon’s second stage is both a cash printer and a ceiling.',
  },
  {
    id: 'valuation',
    cat: 'Money',
    title: 'Not just a rocket shop',
    kid: 'People used to value SpaceX like an airplane factory. Now they value it more like a mix of NASA, Verizon, and a Mars startup.',
    deep: 'By 2025–26 outside reports put annual revenue in the mid-to-high teens of billions, with Starlink the majority, launch a strong minority, and NASA/HLS a smaller slice. Launch wins prestige and national-security lock-in. Connectivity drops cash. Starship spends it. Understanding SpaceX means holding all three books in your head at once.',
  },
  {
    id: 'mars',
    cat: 'History',
    title: 'The actual mission',
    kid: 'Under the internet and the NASA trucks, the point of the company is still: make life multiplanetary. Mars is the reason the factory exists.',
    deep: 'Investors underwrite Starlink. The founder underwrites Mars. That tension is the strategy. A pure ISP would not build Starship. A pure Mars society would have gone bankrupt in 2008. The business is a stack of cash engines pointed at a destination that does not yet have a market. Teach kids that part last — after they understand reuse and cadence — or it sounds like a cartoon.',
  },
]

export const CHAPTERS: Chapter[] = [
  {
    id: 'garage',
    year: '2002–08',
    title: 'Garage & Kwajalein',
    kid: 'You have almost no money and a small rocket called Falcon 1. Light it at the right moment. In real life they missed three times.',
    deep: 'Internal funding, a borrowed atoll, and a company that would have died on a fourth failure. Iteration is the product.',
    mission: 'ignition',
    missionHint: 'Tap when the needle is in the green. Three real failures. Make Flight 4 count.',
    building: 'The island pad',
    reward: { cash: 8, value: 20 },
    unlock: ['founding', 'falcon1'],
    decision: {
      prompt: 'NASA might pay you to haul cargo if you keep going. Tesla also needs the last of the cash.',
      kid: 'Do you bet the company on NASA cargo — or keep the last dollars “safe”?',
      deep: 'December 2008: CRS (~$1.6B) after Flight 4. Musk split remaining personal capital with Tesla. That is the origin story of commercial cargo.',
      a: {
        id: 'nasa-bet',
        label: 'Bet on NASA cargo',
        kid: 'Scary. Also how SpaceX actually survived.',
        result: 'Fixed-price cargo becomes the first real business. NASA trust +1.',
        cash: 12,
        trust: 3,
        users: 0,
        unlock: 'cots',
      },
      b: {
        id: 'play-safe',
        label: 'Sit on the last cash',
        kid: 'Feels safe. In 2008 it would have been the end.',
        result: 'No CRS. You limp. The industry stays cost-plus a little longer.',
        cash: 2,
        trust: -1,
        users: 0,
      },
    },
  },
  {
    id: 'nasa',
    year: '2008–12',
    title: 'The NASA bet',
    kid: 'Build Falcon 9 and Dragon yourselves, in the right order. This is the “we make the whole rocket” lesson.',
    deep: 'COTS milestones fund Falcon 9 + Dragon. Vertical integration vs buying Russian engines and Boeing buses.',
    mission: 'stack',
    missionHint: 'Tap parts in order to stack the vehicle before the clock hits zero.',
    building: 'Hawthorne factory',
    reward: { cash: 20, value: 40 },
    unlock: ['costplus', 'vertical'],
    decision: {
      prompt: 'A supplier will sell you engines. Or you keep building Merlin in-house.',
      kid: 'Buy engines (faster this year) or build your own (faster forever)?',
      deep: 'ULA’s RD-180 problem later proved the point. Owning the engine is owning the cadence.',
      a: {
        id: 'merlin',
        label: 'Keep building Merlin',
        kid: 'Harder today. This is the real SpaceX move.',
        result: 'You own the throttle. Factory XP up.',
        cash: 6,
        trust: 1,
        users: 0,
      },
      b: {
        id: 'buy-engines',
        label: 'Buy engines this year',
        kid: 'You ship one rocket faster and stay dependent.',
        result: 'A launch happens. The supplier now owns your schedule.',
        cash: 14,
        trust: 0,
        users: 0,
      },
    },
  },
  {
    id: 'reuse',
    year: '2015–17',
    title: 'Land it',
    kid: 'Steer the booster and burn at the right time so it sticks the landing. A landed booster is a piggy bank.',
    deep: 'First stage ≈ most of the cost. LZ and droneship landings, then reflights, rewrote the price list.',
    mission: 'land',
    missionHint: 'Steer over the pad. Hold burn to slow down. Soft + centered = money.',
    building: 'Landing zone',
    reward: { cash: 18, value: 55, boosters: 1 },
    unlock: ['reuse', 'expend', 'fairings'],
    decision: {
      prompt: 'A customer will pay extra if you expend the booster and lift more mass.',
      kid: 'Cash today, or a booster you can fly next month?',
      deep: 'Expendable mode is still offered. The winning default was almost always “land it, fly it again.”',
      a: {
        id: 'land-it',
        label: 'Land and keep the booster',
        kid: 'Less payload. A fleet starts.',
        result: 'Booster saved. Next flight is cheaper. This is the business.',
        cash: 8,
        trust: 1,
        users: 0,
      },
      b: {
        id: 'expend-it',
        label: 'Expend for extra payload',
        kid: 'A fatter check. No booster left.',
        result: 'You won the mission and threw away the factory’s best teacher.',
        cash: 22,
        trust: 0,
        users: 0,
      },
    },
  },
  {
    id: 'crew',
    year: '2014–20',
    title: 'Crew Dragon',
    kid: 'Watch the boards. Abort only when a system actually goes red. Human spaceflight is mostly discipline.',
    deep: 'Commercial Crew vs Soyuz seats. Demo-2, 2020. Certification is the product NASA bought.',
    mission: 'crew',
    missionHint: 'When a system flashes red, tap it. Do not abort a clean board.',
    building: 'Dragon bay',
    reward: { cash: 25, value: 70 },
    unlock: ['crew', 'gwynne'],
    decision: {
      prompt: 'Boeing got a bigger NASA crew check. You got less money and a harder clock.',
      kid: 'Bid low and move fast, or bid fat like the old primes?',
      deep: 'CCtCap: SpaceX ~$2.6B, Boeing ~$4.2B. Fixed-price plus a working capsule beat a larger award.',
      a: {
        id: 'bid-lean',
        label: 'Bid lean, fly sooner',
        kid: 'The real choice. Tight and proud.',
        result: 'NASA gets a ride. You get the reliability stats.',
        cash: 10,
        trust: 3,
        users: 0,
      },
      b: {
        id: 'bid-fat',
        label: 'Bid like a prime',
        kid: 'More NASA money, slower ship.',
        result: 'The award looks comfy. Someone else might beat you to crew.',
        cash: 18,
        trust: 0,
        users: 0,
      },
    },
  },
  {
    id: 'starlink',
    year: '2019–25',
    title: 'The constellation',
    kid: 'Place satellites in even rings around Earth. Coverage is the product. Rockets are how you print it.',
    deep: 'Starlink is the cash engine. SpaceX became its own launch customer. Recurring revenue vs one-shot launch fees.',
    mission: 'constellation',
    missionHint: 'Tap empty slots to fill three orbital shells evenly. Gaps lose coverage.',
    building: 'Starlink factory',
    reward: { cash: 16, value: 90 },
    unlock: ['starlink', 'selflaunch', 'starshield', 'dtc'],
    decision: {
      prompt: 'A GEO customer will pay $70M, or you can fly those slots as Starlink.',
      kid: 'One fat launch check, or more internet subscribers forever?',
      deep: 'By the mid-2020s most Falcon 9s flew Starlink because the net present value of capacity beat a single launch fee — and the manifest filled up.',
      a: {
        id: 'fly-starlink',
        label: 'Fly Starlink',
        kid: 'Smaller check today. The real company.',
        result: 'Users up. Launch becomes a factory for your own network.',
        cash: 6,
        trust: 0,
        users: 8,
      },
      b: {
        id: 'fly-geo',
        label: 'Take the GEO check',
        kid: 'Classic launch-service business.',
        result: 'Nice revenue. Your constellation waits. Rivals notice the open sky.',
        cash: 20,
        trust: 1,
        users: 0,
      },
    },
  },
  {
    id: 'cadence',
    year: '2022–26',
    title: 'Airport mode',
    kid: 'Three pads. Stack, launch, land, repeat. Keep the airline running.',
    deep: 'Florida alone on a 2-day drumbeat. Cadence amortizes people and buys the reliability number NSSL pays for.',
    mission: 'cadence',
    missionHint: 'Keep all three pads busy. Tap each pad when it yells for you.',
    building: 'Three-pad row',
    reward: { cash: 22, value: 80, boosters: 1 },
    unlock: ['cadence', 'insurance', 'faa'],
    decision: {
      prompt: 'The FAA wants a slower week after a messy landing. Marketing wants a record.',
      kid: 'Push the record, or stand down and keep the license clean?',
      deep: 'Range and environmental process are production equipment. Flying angry at the FAA is how you stop flying.',
      a: {
        id: 'stand-down',
        label: 'Stand down, fix the paper',
        kid: 'Adult move. Fly next week.',
        result: 'Trust with the range holds. Cadence resumes.',
        cash: 4,
        trust: 2,
        users: 1,
      },
      b: {
        id: 'push-record',
        label: 'Push the flight record',
        kid: 'Looks cool on a poster.',
        result: 'You might get the record and a grounding.',
        cash: 10,
        trust: -2,
        users: 0,
      },
    },
  },
  {
    id: 'starship',
    year: '2023–26',
    title: 'Chopsticks',
    kid: 'Catch the booster in the tower window. Full reuse means even the giant comes home.',
    deep: 'Catch deletes legs. Stainless + Raptor + Starlink V3 + HLS. A capital sink aimed at collapsing $/kg.',
    mission: 'catch',
    missionHint: 'Tap CATCH when the booster is inside the glowing window.',
    building: 'Mechazilla',
    reward: { cash: 14, value: 120, boosters: 1 },
    unlock: ['starship', 'hls', 'secondstage', 'mars'],
    decision: {
      prompt: 'NASA wants a Moon lander. Starlink wants the next 40 ships for V3.',
      kid: 'Moon contract or internet factory?',
      deep: 'HLS pays milestones and human-rates the stack. Starlink V3 is the reason the stack has a business. SpaceX is trying to do both.',
      a: {
        id: 'hls',
        label: 'Take the Moon lander',
        kid: 'Government cash + a harder exam.',
        result: 'HLS money and requirements. Mars hardware with a customer.',
        cash: 18,
        trust: 3,
        users: 0,
        unlock: 'hls',
      },
      b: {
        id: 'v3',
        label: 'Flood the sky with V3',
        kid: 'The cash engine gets louder.',
        result: 'Capacity jumps. NASA waits in line with everyone else.',
        cash: 8,
        trust: 0,
        users: 12,
      },
    },
  },
  {
    id: 'industry',
    year: 'Now',
    title: 'The industry',
    kid: 'Bid against ULA, Blue Origin, and Rocket Lab. Price, trust, and whether you already fly every week all matter.',
    deep: 'Dual-source NSSL, Kuiper vs Starlink, China, and the “next SpaceX” problem. Market structure, not just hardware.',
    mission: 'bid',
    missionHint: 'Pick a contract, then a price. Too greedy and you lose. Too cheap and you lose money.',
    building: 'The industry desk',
    reward: { cash: 20, value: 100 },
    unlock: ['nssl', 'ula', 'blue', 'rlab', 'kuiper', 'china', 'valuation'],
  },
]

export function chapterById(id: string) {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0]
}
