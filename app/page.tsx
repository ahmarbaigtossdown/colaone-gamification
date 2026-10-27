"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";

type Stage = "landing" | "capture" | "game" | "win";
type FieldName = "name" | "email" | "phone" | "consent";
type FormValues = { name: string; email: string; phone: string; consent: boolean };
type FormErrors = Partial<Record<FieldName, string>>;

type Reward = {
  title: string;
  copy: string;
  code: string;
  angle: number;
};

type Coupon = {
  code: string;
  name: string;
  type: string;
  scope: string;
  value: number | null;
  startAt: string;
  endAt: string | null;
};

type CouponResponse = { success: boolean; data: Coupon[] };

const campaignImages = ["/assets/asset-1.png", "/assets/asset-4.png", "/assets/asset-5.png"];

const initialValues: FormValues = { name: "", email: "", phone: "", consent: false };

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.consent) errors.consent = "Accept the terms to unlock your spin.";
  return errors;
}

function couponCopy(coupon: Coupon) {
  if (coupon.type === "BUY_X_GET_Y") return "Buy 1 · Get 1 Free";
  if (coupon.scope === "ITEM" && coupon.value === 100) return "Any Cola One drink";
  return coupon.scope === "ITEM" ? "Selected item" : "Your purchase";
}

function normalizeCoupons(coupons: Coupon[]): Reward[] {
  const segmentSize = 360 / coupons.length;
  return coupons.map((coupon, index) => ({
    title: coupon.name,
    copy: couponCopy(coupon),
    code: coupon.code,
    angle: index * segmentSize,
  }));
}

export default function HomePage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [slide, setSlide] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [couponError, setCouponError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/coupons", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as CouponResponse;
        if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
          throw new Error("Coupons could not be loaded.");
        }
        return payload.data;
      })
      .then((coupons) => {
        if (!active) return;
        const nextRewards = normalizeCoupons(coupons);
        setRewards(nextRewards);
        setReward(nextRewards[0] ?? null);
        setCouponError(nextRewards.length ? "" : "No coupons are available right now.");
      })
      .catch(() => {
        if (active) setCouponError("Coupons could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setIsLoadingRewards(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (stage === "landing") return;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % campaignImages.length), 5200);
    return () => window.clearInterval(timer);
  }, [stage]);

  const rewardLines = useMemo(() => reward?.title.split(" ") ?? [], [reward]);

  function enterFizzMode() {
    setStage("capture");
    setCopyStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(field: keyof FormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    if (submitted) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setSubmitted(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstInvalid = (Object.keys(nextErrors)[0] ?? "name") as FieldName;
      document.getElementById(firstInvalid === "consent" ? "consent" : firstInvalid)?.focus();
      return;
    }
    setStage("game");
  }

  function spinWheel() {
    if (isSpinning || !rewards.length) return;
    const nextReward = rewards[Math.floor(Math.random() * rewards.length)];
    setReward(nextReward);
    setRotation((current) => {
      const currentAngle = ((current % 360) + 360) % 360;
      const targetAngle = ((360 - nextReward.angle) + 360) % 360;
      const correction = (targetAngle - currentAngle + 360) % 360;
      return current + 2160 + correction;
    });
    setIsSpinning(true);
    window.setTimeout(() => {
      setIsSpinning(false);
      setStage("win");
    }, 4700);
  }

  async function copyRewardCode() {
    if (!reward) return;
    try {
      await navigator.clipboard.writeText(reward.code);
      setCopyStatus("COPIED ✓");
    } catch {
      setCopyStatus(`Copy unavailable — use ${reward.code}`);
    }
    window.setTimeout(() => setCopyStatus(""), 2200);
  }

  return (
    <main className={`app stage-${stage}`}>
      {stage === "landing" ? (
        <section className="screen landing-screen">
          <div className="brand-bg landing-bg" />
          <div className="beam" />
          <div className="shell">
            <Nav count="01 — 03" label="Cola One / Fizz Mode" />
            <div className="entry">
              <div className="hero-copy">
                <div className="mini">The fizz is live</div>
                <h1 className="mega">ONE SPIN.<br /><span className="blue">BE THE ONE.</span></h1>
                <p>Not another discount wheel. This is a full-flavour drop. Pick up the energy, hit the spin and let Cola One decide what you unlock.</p>
                <div className="cta-row">
                  <button className="cta red" type="button" onClick={enterFizzMode}>ENTER FIZZ MODE →</button>
                  <span className="hero-note">1 spin · instant reward</span>
                </div>
              </div>
            </div>
            <Ticker />
          </div>
        </section>
      ) : (
        <section className="screen interaction-screen">
          <div className="campaign-background" aria-hidden="true">
            {campaignImages.map((image, index) => (
              <div key={image} className={`bg-slide ${slide === index ? "active" : ""}`} style={{ backgroundImage: `url(${image})` }} />
            ))}
            <div className="bg-shade" />
          </div>
          <div className="slide-dots" aria-label="Campaign slides">
            {campaignImages.map((image, index) => (
              <button key={image} className={`slide-dot ${slide === index ? "active" : ""}`} type="button" aria-label={`Banner ${index + 1}`} onClick={() => setSlide(index)} />
            ))}
          </div>
          <div className="shell">
            <Nav count={stage === "capture" ? "02 — 03" : "03 — 03"} label="Cola One / Fizz Mode" />
            <div className="inner">
              <div className="side-art" aria-hidden="true" />
              <div className="card">
                {stage === "capture" && (
                  <form className="capture-state" onSubmit={submitDetails} noValidate>
                    <div className="card-kicker">01 / Unlock your spin</div>
                    <h2>DROP YOUR<br /><span>DETAILS.</span></h2>
                    <p className="desc">Three quick fields. Then the wheel is yours.</p>
                    <div className="fields">
                      <Field id="name" label="Full name *" value={values.name} placeholder="Your name" error={errors.name} onChange={(value) => updateField("name", value)} />
                      <Field id="email" label="Email *" value={values.email} placeholder="you@email.com" error={errors.email} onChange={(value) => updateField("email", value)} type="email" />
                      <Field id="phone" label="Phone *" value={values.phone} placeholder="+92 3XX XXXXXXX" error={errors.phone} onChange={(value) => updateField("phone", value)} full />
                    </div>
                    <label className={`consent ${errors.consent ? "has-error" : ""}`} htmlFor="consent">
                      <input id="consent" type="checkbox" checked={values.consent} onChange={(event) => updateField("consent", event.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} />
                      <span>I agree to the Terms &amp; Conditions and Privacy Policy.</span>
                    </label>
                    {errors.consent && <p className="field-error consent-error" id="consent-error">{errors.consent}</p>}
                    <button className="cta blue full" type="submit">UNLOCK MY SPIN →</button>
                    {submitted && Object.keys(errors).length > 0 && <p className="validation-summary" role="alert">Please fix the highlighted fields to unlock your spin.</p>}
                  </form>
                )}

                {stage === "game" && (
                  <div className="game-state">
                    <div className="game-head">
                      <div className="game-kicker">Your details are in. Now play.</div>
                      <h2>SPIN &amp; <span>WIN.</span></h2>
                      <p className="game-sub">One spin. One instant Cola One reward.</p>
                    </div>
                    {isLoadingRewards && <div className="wheel-status">LOADING COUPONS…</div>}
                    {!isLoadingRewards && couponError && <div className="wheel-status wheel-error" role="alert">{couponError}</div>}
                    {rewards.length > 0 && <Wheel rewards={rewards} rotation={rotation} onSpin={spinWheel} isSpinning={isSpinning} />}
                    <button className="spin-btn" type="button" onClick={spinWheel} disabled={isSpinning || isLoadingRewards || !rewards.length}>{isSpinning ? "SPINNING…" : "SPIN THE WHEEL →"}</button>
                    <div className="spin-meta">Instant reward reveal</div>
                  </div>
                )}

                {stage === "win" && (
                  <div className="win-state">
                    <div className="win-kicker">Fizz secured · reward unlocked</div>
                    <h2 className="win-title">YOU HIT <span>THE FIZZ.</span></h2>
                    <div className="win-accent" />
                    <div className="win-reward">{rewardLines[0]}<br />{rewardLines.slice(1).join(" ")}</div>
                    <p className="win-copy">{reward?.copy} — your Cola One reward is ready. Use it before the fizz runs out.</p>
                    <div className="reward-box">
                      <div className="reward-code"><small>Your reward code</small><strong>{reward?.code}</strong></div>
                      <button className="copy-mini" type="button" onClick={copyRewardCode}>{copyStatus || "COPY CODE"}</button>
                    </div>
                    <button className="claim-btn" type="button" onClick={() => setClaimed(true)} disabled={claimed}>{claimed ? "REWARD READY ✓" : "CLAIM MY REWARD →"}</button>
                    <div className="win-meta">Valid for 48 hours · one redemption per customer · T&amp;Cs apply</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Nav({ count, label }: { count: string; label: string }) {
  return <nav className="nav"><img className="logo" src="/assets/asset-3.webp" alt="Cola One" /><div className="nav-word">{label}</div><div className="nav-count">{count}</div></nav>;
}

function Ticker() {
  return <div className="ticker"><div>COLA ONE &nbsp; ✦ &nbsp; BUZZ UP &nbsp; ✦ &nbsp; ZINK &nbsp; ✦ &nbsp; CRACK IT &nbsp; SPIN IT &nbsp; WIN IT &nbsp; ✦ &nbsp; COLA ONE &nbsp; ✦ &nbsp; BUZZ UP &nbsp; ✦ &nbsp; ZINK &nbsp; ✦ &nbsp; CRACK IT &nbsp; SPIN IT &nbsp; WIN IT &nbsp; ✦ &nbsp;</div></div>;
}

function Field({ id, label, value, placeholder, error, onChange, type = "text", full = false }: { id: FieldName; label: string; value: string; placeholder: string; error?: string; onChange: (value: string) => void; type?: string; full?: boolean }) {
  const errorId = `${id}-error`;
  return <div className={`field ${full ? "full" : ""}`}><label htmlFor={id}>{label}</label><input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />{error && <p className="field-error" id={errorId}>{error}</p>}</div>;
}

function Wheel({ rewards, rotation, onSpin, isSpinning }: { rewards: Reward[]; rotation: number; onSpin: () => void; isSpinning: boolean }) {
  const segmentSize = 360 / rewards.length;
  const gradient = `conic-gradient(from ${-segmentSize / 2}deg, ${rewards.map((_, index) => {
    const start = index * segmentSize;
    const end = (index + 1) * segmentSize;
    const color = index % 2 ? "#18baf0" : "#f3152c";
    return `${color} ${start}deg ${end}deg`;
  }).join(", ")})`;

  const wheelStyle = {
    transform: `rotate(${rotation}deg)`,
    background: gradient,
  } as CSSProperties;

  return <div className="wheel-wrap"><div className="pointer" /><div className="wheel" style={wheelStyle}>{rewards.map((_, index) => <span className="wheel-divider" style={{ "--divider-angle": `${(index + 0.5) * segmentSize}deg` } as CSSProperties} key={`divider-${index}`} />)}{rewards.map((reward, index) => {
    const angleInRadians = ((reward.angle - 90) * Math.PI) / 180;
    const radius = rewards.length <= 4 ? 31 : rewards.length <= 6 ? 34 : 37;
    const left = 50 + Math.cos(angleInRadians) * radius;
    const top = 50 + Math.sin(angleInRadians) * radius;
    const labelWidth = rewards.length <= 4 ? "30%" : rewards.length <= 6 ? "32%" : "24%";
    const labelStyle = { left: `${left}%`, top: `${top}%`, right: "auto", bottom: "auto", width: labelWidth } as CSSProperties;
    return <div className={`wl wl-${index}`} style={labelStyle} data-reward-title={reward.title} data-reward-copy={reward.copy} data-reward-code={reward.code} data-reward-angle={reward.angle} key={`${reward.code}-${index}`}><span>{reward.title}</span><small>{reward.copy}</small></div>;
  })}</div><button className="hub" type="button" onClick={onSpin} disabled={isSpinning} aria-label={isSpinning ? "Wheel is spinning" : "Spin the wheel"}><img src="/assets/asset-3.webp" alt="Cola One" /></button></div>;
}
