import "./Numbercard.css";

function Numbercard({ title, value }) {
  return (
    <div className="d-flex flex-row container-fluid numbercard rounded-1 p-3">
      {}
      <div className="d-flex flex-column">
        <h1 className="display-3">{value}</h1>
        <p className="mb-0">{title}</p>
      </div>
    </div>
  );
}

export default Numbercard;