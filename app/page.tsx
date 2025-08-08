"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  HandCoins,
  MessageSquare,
  ShieldCheck,
  Users,
  Zap,
  Instagram,
  Twitter,
  PhoneCall,
  Fingerprint,
  Bot,
  Coins,
  Link2,
  Wallet,
  QrCode,
  Lock,
  Download,
  BadgeCheck,
  ShieldAlert,
  Activity,
  Bell,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Brand
const PRIMARY = "#7930C8";
const PRIMARY_OTHER = "#9340ebff";
const SECONDARY = "#0D011F";
const BRAND_GRADIENT = `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_OTHER} 100%)`;

// Animations
const fadeUpContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};
const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const floatAnim = {
  animate: { y: [0, -6, 0] },
  transition: { duration: 6, repeat: Infinity as const, ease: "easeInOut" },
};

// TODO: Replace with your real WhatsApp group invite link
const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/FKa9Jw5rYfqFyluH23Y3gv?mode=ac_t";

export default function Page() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [offHero, setOffHero] = useState(false);

  // Observe hero visibility to toggle frosted header
  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setOffHero(!(entry.isIntersecting && entry.intersectionRatio > 0.2)),
      { root: null, threshold: [0, 0.2, 1] }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#0D011F]">
      <Header offHero={offHero} />
      <Hero heroRef={heroRef as any} />
      <WhyZend />
      <Explainers />
      <Features />
      <HowItWorks />
      <FeesAndTrust />
      <RiskMonitoring />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

/* Header — transparent on hero with primary-colored nav; frosted + secondary when off hero */
function Header({ offHero }: { offHero: boolean }) {
  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-all",
        offHero
          ? "bg-white/30 backdrop-blur-md"
          : "border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="#" className="flex items-center gap-2">
          <img src="/logo.png" alt="ZEND logo" className="h-7 w-7" />
          <span
            className="text-lg font-semibold tracking-tight transition-colors"
            style={{ color: PRIMARY }}
          >
            ZEND
          </span>
        </Link>
        {/* <nav
          className={[
            "hidden items-center gap-6 text-sm md:flex transition-colors",
            offHero ? "text-[#0D011F]" : "text-[color:var(--primary)]",
          ].join(" ")}
          style={{ ["--primary" as any]: PRIMARY }}
        >
          <a href="#features" className="hover:opacity-90">Features</a>
          <a href="#how-it-works" className="hover:opacity-90">How it works</a>
          <a href="#faq" className="hover:opacity-90">FAQ</a>
          <a href="#contact" className="hover:opacity-90">Contact</a>
        </nav> */}
        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className={[
                "h-9 rounded-full px-4 text-white shadow-sm hover:opacity-95 transition-colors",
                offHero ? "" : "ring-1 ring-[color:var(--primary)]/30",
              ].join(" ")}
              style={{
                ["--primary" as any]: PRIMARY,
                backgroundImage: BRAND_GRADIENT,
              }}
            >
              Join Waitlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}

/* HERO — center text and image; image sits under text; entrance animation on text */
function Hero({ heroRef }: { heroRef: React.RefObject<HTMLDivElement> }) {
  return (
    <section
      ref={heroRef}
      id="hero"
      style={{
        backgroundRepeat: "no-repeat",
        backgroundSize: "300px",
        backgroundPosition: "bottom center",
      }}
      className="relative overflow-hidden bg-[#0D011F] text-white h-[100vh]"
    >
      {/* Spacer for fixed header */}
      <div className="h-14" aria-hidden="true" />

      {/* Subtle brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundColor: `radial-gradient(65% 45% at 50% 5%, ${hexToRgba(
            PRIMARY,
            0.22
          )} 0%, ${hexToRgba(PRIMARY, 0)} 60%)`,
        }}
      />

      <div className="mx-auto my-auto flex max-w-6xl flex-col items-center px-4 pt-8 pb-10 md:pt-10 lg:pt-12">
        {/* Text block */}
        <motion.div
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          className="flex max-w-3xl flex-col items-center text-center"
        >
          <motion.span
            variants={fadeUpItem}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85"
          >
            Just ZEND it.
          </motion.span>

          <motion.h1
            variants={fadeUpItem}
            className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
            style={{
              backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, #E7DFFF 40%, ${PRIMARY} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Secure Payments. Right Inside WhatsApp.
          </motion.h1>

          <motion.p
            variants={fadeUpItem}
            style={{
              backgroundImage: `linear-gradient(135deg, #c67ff5ff 0%, #9981e0ff 40%, ${PRIMARY} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
            className="mt-3 max-w-xl text-white/80 md:text-lg"
          >
            ZEND is the easiest way for vendors and buyers in Nigeria to send,
            receive, and protect payments — all without leaving WhatsApp.
          </motion.p>

          <motion.div variants={fadeUpItem} className="mt-6">
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                size="lg"
                className="rounded-full px-6 text-white shadow-lg hover:opacity-95"
                style={{ backgroundImage: BRAND_GRADIENT }}
              >
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>

          {/* Quick explainers */}
          <motion.ul
            variants={fadeUpItem}
            className="mt-6 grid w-full max-w-lg gap-2 text-sm text-white/85 sm:grid-cols-2"
          >
            <Bullet
              icon={<ShieldCheck className="h-4 w-4" />}
              text="No scam, escrow secures money"
            />
            <Bullet
              icon={<MessageSquare className="h-4 w-4" />}
              text="No switching apps"
            />
            <Bullet
              icon={<Fingerprint className="h-4 w-4" />}
              text="Biometric confirmations"
            />
            <Bullet
              icon={<Coins className="h-4 w-4" />}
              text="Stable coin transfers"
            />
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}

function Bullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center justify-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
        {icon}
      </span>
      {text}
    </li>
  );
}

/* Reusable floating wrapper for equal-height cards with floating shadow */
function FloatingCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUpItem}
      {...floatAnim}
      whileHover={{ y: -8 }}
      transition={{ ...floatAnim.transition, type: "tween" }}
      className="h-full"
      style={{ filter: "drop-shadow(0 14px 30px rgba(121,48,200,0.18))" }}
    >
      {children}
    </motion.div>
  );
}

/* Why ZEND */
function WhyZend() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 pt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Why use ZEND?</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Buying and selling on WhatsApp should be simple, but trust issues,
          payment delays, and app switching make it messy. ZEND fixes that.
        </p>
      </div>
    </section>
  );
}

/* Explainers — equal height */
function Explainers() {
  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(243,233,255,0.45) 0%, rgba(243,233,255,0.00) 60%)",
        }}
      />
      <motion.div
        variants={fadeUpContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto grid max-w-6xl items-stretch gap-4 px-4 py-10 sm:grid-cols-3"
      >
        <ExplainCard
          title="What is ZEND?"
          desc="A WhatsApp-based payment layer for informal vendors and buyers. Create links, hold funds in escrow, release on delivery."
          icon={<Link2 className="h-5 w-5" />}
        />
        <ExplainCard
          title="Who is it for?"
          desc="WhatsApp vendors, small shops, and buyers who want simple, safe payments without leaving chat."
          icon={<Users className="h-5 w-5" />}
        />
        <ExplainCard
          title="Why now?"
          desc="Payments are already social. ZEND brings trust, automation, and speed to the chat you already use."
          icon={<Zap className="h-5 w-5" />}
        />
      </motion.div>
    </section>
  );
}

/* Features — equal height */
function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold">Core Features</h2>
      <motion.div
        variants={fadeUpContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FeatureCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Instant & Escrow Payments"
          desc="Buyers pay securely. Vendors get paid only when delivery is confirmed."
        />
        <FeatureCard
          icon={<Users className="h-5 w-5" />}
          title="Group Payments"
          desc="Offer discounts when a target number of people join a purchase."
        />
        <FeatureCard
          icon={<HandCoins className="h-5 w-5" />}
          title="Help Me Pay"
          desc="Share a payment link and let friends chip in until it’s fully paid."
        />
        <FeatureCard
          icon={<CalendarRange className="h-5 w-5" />}
          title="Vendor Subscriptions"
          desc="Set up recurring billing for digital goods, classes, or services."
        />
        <FeatureCard
          icon={<Bot className="h-5 w-5" />}
          title="AI Money Assistant"
          desc="Chat with your money inside WhatsApp. Track spending. Get smart tips."
        />
        <FeatureCard
          icon={<Coins className="h-5 w-5" />}
          title="Powered by Stable Coin"
          desc="Fast, stable payments using a naira stable coin."
        />
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-semibold">How It Works</h2>
      <motion.div
        variants={fadeUpContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-6 grid items-stretch gap-6 md:grid-cols-2"
      >
        <FloatingCard>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-6">
              <h3 className="font-semibold">For Buyers</h3>
              <ol className="mt-3 space-y-3 text-sm">
                <Step
                  n={1}
                  color={PRIMARY}
                  icon={<Link2 className="h-4 w-4" />}
                  text="Click the vendor’s ZEND payment link on WhatsApp."
                />
                <Step
                  n={2}
                  color={PRIMARY}
                  icon={<Fingerprint className="h-4 w-4" />}
                  text="View order details and confirm with your fingerprint."
                />
                <Step
                  n={3}
                  color={PRIMARY}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  text="Your payment is secured in escrow until delivery."
                />
              </ol>
            </CardContent>
          </Card>
        </FloatingCard>

        <FloatingCard>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-6">
              <h3 className="font-semibold">For Vendors</h3>
              <ol className="mt-3 space-y-3 text-sm">
                <Step
                  n={1}
                  color={PRIMARY}
                  icon={<QrCode className="h-4 w-4" />}
                  text="Generate a payment or group payment link in seconds."
                />
                <Step
                  n={2}
                  color={PRIMARY}
                  icon={<MessageSquare className="h-4 w-4" />}
                  text="Share it with your buyers on WhatsApp."
                />
                <Step
                  n={3}
                  color={PRIMARY}
                  icon={<Wallet className="h-4 w-4" />}
                  text="Get paid instantly once delivery is confirmed."
                />
              </ol>
            </CardContent>
          </Card>
        </FloatingCard>
      </motion.div>
    </section>
  );
}

function FeesAndTrust() {
  return (
    <section className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(237,255,245,0.55) 0%, rgba(237,255,245,0.00) 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid items-stretch gap-6 md:grid-cols-2"
        >
          <FloatingCard>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div
                  className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F3E9FF] px-3 py-1 text-xs font-medium"
                  style={{ color: PRIMARY }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Trust & Security
                </div>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Fingerprint
                      className="mt-0.5 h-4 w-4"
                      style={{ color: PRIMARY }}
                    />
                    Biometric authentication confirms every payment.
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4"
                      style={{ color: "#25D366" }}
                    />
                    Smart contract escrow holds funds until delivery.
                  </li>
                  <li className="flex items-start gap-2">
                    <Star
                      className="mt-0.5 h-4 w-4"
                      style={{ color: PRIMARY }}
                    />
                    Powered by Stellar.
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-4 w-4" />
                    Disputes and refunds handled right in WhatsApp.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div
                  className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EDFFF5] px-3 py-1 text-xs font-medium"
                  style={{ color: "#25D366" }}
                >
                  <Wallet className="h-4 w-4" />
                  Fees & Currency
                </div>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <BadgeCheck
                      className="mt-0.5 h-4 w-4"
                      style={{ color: "#25D366" }}
                    />
                    Sending money to other ZEND users is free.
                  </li>
                  <li className="flex items-start gap-2">
                    <HandCoins
                      className="mt-0.5 h-4 w-4"
                      style={{ color: PRIMARY }}
                    />
                    Small fees apply for vendor sales and external transfers.
                  </li>
                  <li className="flex items-start gap-2">
                    <Coins className="mt-0.5 h-4 w-4" />
                    All payments use a naira‑pegged stable coin.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </FloatingCard>
        </motion.div>
      </div>
    </section>
  );
}

/* Risk Monitoring */
function RiskMonitoring() {
  const gradient = BRAND_GRADIENT;
  const container = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.15 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
  };

  return (
    <section id="risk-monitoring" className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-3 h-1 w-16 rounded-full"
          style={{ backgroundImage: gradient }}
        />
        <h2 className="text-2xl font-semibold">
          Fraud & Transaction Monitoring
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Stay protected and in control with proactive risk checks and real-time
          activity tracking.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="grid items-stretch gap-4 md:grid-cols-2"
      >
        <motion.div variants={item}>
          <motion.div
            {...floatAnim}
            className="relative h-full overflow-hidden rounded-2xl p-6 text-white"
            style={{
              backgroundImage: gradient,
              boxShadow: `0 16px 40px ${hexToRgba(PRIMARY, 0.35)}`,
            }}
            whileHover={{ y: -6 }}
          >
            <motion.span
              aria-hidden="true"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldAlert className="h-5 w-5" />
            </motion.span>

            <div className="relative">
              <h3 className="text-lg font-semibold">Fraud Detection</h3>
              <p className="mt-2 text-sm text-white/85">
                Advanced fraud monitoring system identifies suspicious
                activities and notifies you instantly.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/85">
                <Bell className="h-4 w-4" />
                Instant alerts, right in WhatsApp.
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={item}>
          <motion.div
            {...floatAnim}
            className="relative h-full overflow-hidden rounded-2xl p-6 text-white"
            style={{
              backgroundImage: gradient,
              boxShadow: `0 16px 40px ${hexToRgba(SECONDARY, 0.35)}`,
            }}
            whileHover={{ y: -6 }}
          >
            <motion.span
              aria-hidden="true"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
              animate={{ rotate: [0, 8, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Activity className="h-5 w-5" />
            </motion.span>

            <div className="relative">
              <h3 className="text-lg font-semibold">Transaction Monitoring</h3>
              <p className="mt-2 text-sm text-white/85">
                Real-time visibility into all your payment activities with
                instant notifications.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <motion.div
                  className="rounded-lg px-2 py-1 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Escrow
                </motion.div>
                <motion.div
                  className="rounded-lg px-2 py-1 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                >
                  Subscriptions
                </motion.div>
                <motion.div
                  className="rounded-lg px-2 py-1 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.35,
                  }}
                >
                  Transfers
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="text-2xl font-semibold">FAQ</h2>
      <Accordion type="single" collapsible className="mt-6">
        <AccordionItem value="safety">
          <AccordionTrigger>Is this safe?</AccordionTrigger>
          <AccordionContent>
            Yes — all payments are backed by biometric authentication and smart
            contract escrow.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="app">
          <AccordionTrigger>Do I need to install an app?</AccordionTrigger>
          <AccordionContent>
            No app needed. Everything works inside WhatsApp with a smart AI bot.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fees">
          <AccordionTrigger>What does it cost?</AccordionTrigger>
          <AccordionContent>
            Sending money to other ZEND users is free. Small fees apply for
            vendor sales and external transfers.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="currency">
          <AccordionTrigger>What currency does ZEND use?</AccordionTrigger>
          <AccordionContent>
            All payments are powered by a naira stable coin.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <FloatingCard>
        <Card className="h-full border">
          <CardContent className="flex h-full flex-col p-8 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-semibold">Join the Movement</h3>
                <p className="mt-2 text-muted-foreground">
                  ZEND is building the future of social payments in Africa —
                  starting with Nigeria.
                </p>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button
                    className="rounded-full px-6 text-white shadow-sm hover:opacity-95"
                    style={{ backgroundImage: BRAND_GRADIENT }}
                  >
                    Get Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </FloatingCard>
    </section>
  );
}

/* Footer — secondary background, primary text */
function Footer() {
  return (
    <footer
      id="contact"
      className="mt-8"
      style={{ backgroundColor: SECONDARY, color: PRIMARY }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ZEND logo" className="h-6 w-6" />
            <span className="text-sm font-medium">ZEND</span>
            <Separator
              orientation="vertical"
              className="mx-2 hidden h-5 md:inline-flex"
            />
            <span className="text-xs opacity-80">Just ZEND it.</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/ZendIt_Official?t=7V6p0Wj080aMkn18cBhDxg&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm hover:opacity-90"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="mt-4 text-xs opacity-80">
          © {new Date().getFullYear()} ZEND. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* UI helpers */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
      {children}
    </span>
  );
}

function ExplainCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <FloatingCard>
      <Card className="h-full transition-colors">
        <CardContent className="flex h-full flex-col p-5">
          <div
            className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            {icon}
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          <div className="mt-auto" />
        </CardContent>
      </Card>
    </FloatingCard>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <FloatingCard>
      <Card className="h-full transition-colors ">
        <CardContent className="flex h-full flex-col p-5">
          <div
            className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: PRIMARY }}
            aria-hidden="true"
          >
            {icon}
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          <div className="mt-auto" />
        </CardContent>
      </Card>
    </FloatingCard>
  );
}

function Step({
  n,
  color,
  icon,
  text,
}: {
  n: number;
  color: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {n}
      </span>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}22` }}
          >
            {icon}
          </span>
          <span className="font-medium">Step {n}</span>
        </div>
        <p>{text}</p>
      </div>
    </li>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
