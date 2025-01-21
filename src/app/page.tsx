"use client";

import { ChangeEvent, useEffect, useState } from "react";
import NavbarComponent from "./Components/navbarComponent";
import { Container, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import axios from "axios";
import { Currencies } from "./Common/interfaces/currencies";

export default function Home() {
  const [amount, setAmount] = useState(0);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [conversionResult, setConversionResult] = useState("");
  const [currencies, setCurrencies] = useState<
    Array<{ code: string; name: string; symbol: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get<Currencies>("https://api.fxratesapi.com/currencies")
      .then((response) => {
        const fetchedCurrencies = Object.entries(response.data).map(
          ([code, details]) => ({
            code,
            name: details.name,
            symbol: details.symbol_native,
          })
        );
        setCurrencies(fetchedCurrencies);
        setFromCurrency("USD"); // Set default currency after fetching
        setToCurrency("EUR"); // Set default target currency
      })
      .catch((error) => console.error("Error fetching currencies: ", error));
  }, []);

  // Update handleConvert to handle loading and error states
  const handleConvert = () => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    setLoading(true);
    const url = `https://api.fxratesapi.com/convert?from=${fromCurrency}&to=${toCurrency}&date=${dateString}&amount=${amount}&format=json`;

    axios
      .get(url)
      .then((response) => {
        const result = response.data.result; // Assume API returns a field 'result' with the conversion
        setConversionResult(result);
        setLoading(false);
        setError("");
      })
      .catch((error) => {
        console.error("Error converting currency: ", error);
        setError("Failed to convert currency. Please try again.");
        setLoading(false);
      });
  };

  const handleFromCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFromCurrency(e.target.value);
    setConversionResult(""); // Clear the conversion result
  };

  const handleToCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setToCurrency(e.target.value);
    setConversionResult(""); // Clear the conversion result
  };

  // Perform conversion
  useEffect(() => {
    if (amount !== 0) {
      // Avoid conversion when amount is 0
      const convertCurrency = async () => {
        try {
          const response = await axios.get(
            `https://api.fxratesapi.com/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
          );
          setConversionResult(response.data.result);
        } catch (error) {
          console.error("Error converting currency:", error);
          setConversionResult("Conversion failed");
        }
      };

      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency]);

  return (
    <>
      <NavbarComponent />

      <Container className="mt-5">
        <Row>
          <Col md={4}>
            <span>Amount</span>
            <InputGroup className="mb-3">
              <Form.Control
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                placeholder="Amount"
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <span>From</span>
            <Form.Select
              value={fromCurrency}
              onChange={handleFromCurrencyChange}
            >
              {currencies.map(({ code, name, symbol }) => (
                <option key={code} value={code}>{`${name} (${symbol})`}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <span>To</span>
            <Form.Select value={toCurrency} onChange={handleToCurrencyChange}>
              {currencies.map(({ code, name, symbol }) => (
                <option key={code} value={code}>{`${name} (${symbol})`}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">{error}</p>}
            {!loading && !error && conversionResult && (
              <Container>
                <h3>
                  Converted Amount:{" "}
                  {conversionResult || "Enter values to see the result"}
                </h3>
              </Container>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
