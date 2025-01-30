import { NextPage } from "next";
import { Container, Navbar } from "react-bootstrap";

const NavbarComponent: NextPage = () => {
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="#home" className="text-primary fw-bold">
          Currency Converter
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
