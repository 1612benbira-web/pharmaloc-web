export default function Placeholder({ title, text }) {
  return (
    <section className="stack">
      <h1>{title}</h1>
      <p className="muted">{text}</p>
    </section>
  );
}
