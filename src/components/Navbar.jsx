function Navbar() {
  return (
    <div className="navbar">
      <h2>GoodHome</h2>
      <button
        onClick={() => {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;
