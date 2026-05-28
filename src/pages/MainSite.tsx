import { motion } from 'framer-motion'
import { Twitter, Dumbbell, User, Coffee } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.21, 0.92, 0.26, 1] as const } 
  }
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export default function MainSite() {
  return (
    <div className="max-w-[680px] mx-auto px-6 py-12 text-[#e5e5e5]">
      
      {/* Hero */}
      <motion.header 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.92, 0.26, 1] }}
        className="pt-12 pb-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1f1f1f] px-3 py-1 text-xs tracking-[2px] text-[#6b7280] mb-6">
          X • KRÜE • DAD • COFFEE
        </div>

        <div className="flex items-start gap-6">
          <motion.img 
            src="/images/dan.jpg" 
            alt="Dan" 
            className="w-24 h-24 rounded-2xl object-cover border border-[#1f1f1f]"
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          <div className="pt-1">
            <h1 className="text-[68px] leading-none font-semibold tracking-[-5px] text-[#f5f5f5]">
              DAN
            </h1>
            <p className="mt-1 text-xl text-[#a3a3a3]">@KettlebellDan on X</p>
          </div>
        </div>
      </motion.header>

      {/* Intro */}
      <div className="max-w-[48ch] text-[15px] leading-relaxed text-[#c4c4c4]">
        <p>
          Proud X employee and founder of the Kettlebell Krüe. 
          I spend my days building with AI, swinging iron, and trying to be the dad my kids deserve.
        </p>
      </div>

      {/* Pillars */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-14"
      >
        <div className="text-xs tracking-[2.5px] text-[#6b7280] mb-6">PILLARS</div>

        {/* X Employee */}
        <motion.div 
          variants={fadeUp} 
          whileHover={{ y: -4, borderColor: '#3f3f46' }}
          className="mb-8 group rounded-2xl border border-[#1f1f1f] p-6 transition-colors hover:border-[#3f3f46]"
        >
          <div className="flex items-center gap-3 mb-3">
            <Twitter className="w-6 h-6 text-[#d1d5db] transition-transform group-hover:scale-110" />
            <div className="font-semibold text-2xl text-white tracking-[-0.5px]">X Employee</div>
          </div>
          <p className="text-[15px] text-[#b3b3b3]">
            I work at X. I’m genuinely excited about what we’re building — especially tools like Grok Build that let me ship personal projects in minutes instead of hours.
          </p>
        </motion.div>

        {/* Kettlebell Krüe */}
        <motion.div 
          variants={fadeUp} 
          whileHover={{ y: -4, borderColor: '#3f3f46' }}
          className="mb-8 group rounded-2xl border border-[#1f1f1f] p-6 transition-colors hover:border-[#3f3f46]"
        >
          <div className="flex items-center gap-3 mb-3">
            <Dumbbell className="w-6 h-6 text-[#d1d5db] transition-transform group-hover:scale-110" />
            <div className="font-semibold text-2xl text-white tracking-[-0.5px]">Kettlebell Krüe</div>
          </div>
          <p className="text-[15px] text-[#b3b3b3]">
            Founder of the Krüe — discipline, iron, and showing up when it’s hard. “No mercy. Only iron.”
          </p>
        </motion.div>

        {/* Dad */}
        <motion.div 
          variants={fadeUp} 
          whileHover={{ y: -4, borderColor: '#3f3f46' }}
          className="mb-8 group rounded-2xl border border-[#1f1f1f] p-6 transition-colors hover:border-[#3f3f46]"
        >
          <div className="flex items-center gap-3 mb-3">
            <User className="w-6 h-6 text-[#d1d5db] transition-transform group-hover:scale-110" />
            <div className="font-semibold text-2xl text-white tracking-[-0.5px]">Dad</div>
          </div>
          <p className="text-[15px] text-[#b3b3b3]">
            Present, active, and trying to raise healthy kids. Cooking foods from scratch for our kids is important.
          </p>
        </motion.div>

        {/* Coffee */}
        <motion.div 
          variants={fadeUp} 
          whileHover={{ y: -4, borderColor: '#3f3f46' }}
          className="group rounded-2xl border border-[#1f1f1f] p-6 transition-colors hover:border-[#3f3f46]"
        >
          <div className="flex items-center gap-3 mb-3">
            <Coffee className="w-6 h-6 text-[#d1d5db] transition-transform group-hover:scale-110" />
            <div className="font-semibold text-2xl text-white tracking-[-0.5px]">Coffee</div>
          </div>
          <p className="text-[15px] text-[#b3b3b3]">
            Aeropress, V60, and Chemex every morning. Small daily rituals that make a big difference.
          </p>
        </motion.div>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent my-14" />

      {/* KRÜE TEES */}
      <div>
        <div className="text-xs tracking-[2.5px] text-[#6b7280] mb-6">KRÜE TEES</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.a
            href="https://kettlebell-krue.launchcart.store/unisex-premium-t-shirt/p/p0w96vd"
            target="_blank"
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            className="block rounded-3xl overflow-hidden border border-[#1f1f1f] bg-[#111] group"
          >
            <div className="relative overflow-hidden">
              <img 
                src="/images/mens-krue-tee.png" 
                alt="Men's Krüe Tee" 
                className="w-full transition-transform duration-700 group-hover:scale-[1.08]" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-7">
              <div className="font-semibold text-xl text-white">Heavyweight Tee</div>
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-[#a3a3a3]">Men's Fit</span>
                <span className="font-medium text-white">$30</span>
              </div>
            </div>
          </motion.a>

          <motion.a
            href="https://kettlebell-krue.launchcart.store/womens-relaxed-v-neck-t-shirt/p/mp53jnw"
            target="_blank"
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            className="block rounded-3xl overflow-hidden border border-[#1f1f1f] bg-[#111] group"
          >
            <div className="relative overflow-hidden">
              <img 
                src="/images/womens-krue-tee.png" 
                alt="Women's Krüe Tee" 
                className="w-full transition-transform duration-700 group-hover:scale-[1.08]" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-7">
              <div className="font-semibold text-xl text-white">Relaxed Tee</div>
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-[#a3a3a3]">Women's Fit</span>
                <span className="font-medium text-white">$30</span>
              </div>
            </div>
          </motion.a>
        </div>
        <p className="mt-3 text-xs text-[#6b7280]">Fulfilled by Printful</p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent my-14" />

      {/* Newsletter */}
      <div className="mb-12">
        <div className="text-xs tracking-[2.5px] text-[#6b7280] mb-2">UPDATES</div>
        <p className="text-[15px] text-[#a3a3a3] mb-4 max-w-[42ch]">
          Occasional notes on training, code, and the small things I’m into.
        </p>

        <form 
          action="https://buttondown.com/api/emails/embed-subscribe/kettlebellkrue" 
          method="post"
          className="flex gap-3"
        >
          <input 
            type="email" 
            name="email" 
            placeholder="your@email.com" 
            required 
            className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-2xl px-6 py-3 text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#3f2a2a] focus:scale-[1.01] transition-all" 
          />
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="px-9 rounded-2xl border border-[#2a2a2a] bg-[#111] text-sm font-medium tracking-wide hover:bg-[#161616] transition-colors"
          >
            Join
          </motion.button>
        </form>
        <p className="mt-2 text-[11px] text-[#525252]">Powered by Buttondown. Unsubscribe anytime.</p>
      </div>

      {/* Find me on X */}
      <motion.a 
        href="https://x.com/KettlebellDan" 
        target="_blank"
        whileHover={{ scale: 1.03, x: 4 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#111] px-8 py-4 text-sm font-medium tracking-wide hover:bg-[#161616] transition-colors"
      >
        Find me on X 
        <span className="text-xl">→</span>
      </motion.a>
    </div>
  )
}
