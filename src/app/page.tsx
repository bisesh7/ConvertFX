"use client";

import { useEffect, useState, useCallback } from "react";
import NavbarComponent from "./Components/navbarComponent";
import {
  Container,
  Row,
  Col,
  InputGroup,
  Alert,
  Button,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { Currencies } from "./Common/interfaces/currencies";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaStar, FaRegStar, FaExchangeAlt } from "react-icons/fa";
import Select, { SingleValue } from "react-select";

interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  isFavorite: boolean;
}

interface TimeSeriesResponse {
  result: any;
  rates: {
    [date: string]: {
      [currencyCode: string]: number;
    };
  };
}

interface Rate {
  [currency: string]: number;
}

interface RatesResponse {
  rates: {
    [date: string]: Rate;
  };
}

interface RateDetails {
  [currencyCode: string]: number;
}

interface TimeSeriesRates {
  [date: string]: RateDetails;
}

export default function Home() {
  const [amount, setAmount] = useState<string>(""); // Change to string type
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [conversionResult, setConversionResult] = useState("");
  const [currencies, setCurrencies] = useState<
    Array<{ code: string; name: string; symbol: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [historicalData, setHistoricalData] = useState<
    { date: string; rate: number }[]
  >([]);
  const [showChart, setShowChart] = useState(false);
  const [startDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleFromChange = (newValue: SingleValue<CurrencyOption>) => {
    if (newValue) setFromCurrency(newValue.value);
  };

  const handleToChange = (newValue: SingleValue<CurrencyOption>) => {
    if (newValue) setToCurrency(newValue.value);
  };

  const [currencyLoading, setCurrencyLoading] = useState(true);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteCurrencies");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  const currencyOptions: CurrencyOption[] = currencies.map((currency) => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    symbol: currency.symbol,
    isFavorite: favorites.includes(currency.code),
  }));

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
        setFromCurrency("USD");
        setToCurrency("EUR");
      })
      .catch(console.error)
      .finally(() => setCurrencyLoading(false));
  }, []);

  const handleConvert = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (fromCurrency === toCurrency) {
      setError("Currencies must be different");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get<TimeSeriesResponse>(
        `https://api.fxratesapi.com/convert?from=${fromCurrency}&to=${toCurrency}&amount=${numericAmount}`
      );
      setConversionResult(response.data.result.toFixed(2));
      setError("");
    } catch (error) {
      setError("Conversion failed. Please try again.");
    } finally {
      setLoading(false);
    }

    fetchHistoricalData();
  };

  const fetchHistoricalData = useCallback(async () => {
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date");
      return;
    }

    try {
      const response = await axios.get<RatesResponse>(
        `https://api.fxratesapi.com/timeseries?start_date=${startDate}&end_date=${endDate}&base=${fromCurrency}&currencies=${toCurrency}`
      );

      const sortedEntries = Object.entries(response.data.rates).sort(
        ([dateA], [dateB]) =>
          new Date(dateA).getTime() - new Date(dateB).getTime()
      );

      const formattedData = sortedEntries.map(([date, rates]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        rate: rates[toCurrency] ?? 0,
      }));

      setHistoricalData(formattedData);
      setShowChart(true);
      setError("");
    } catch (error) {
      setError("Failed to load historical data");
    }
  }, [fromCurrency, toCurrency, startDate, endDate]);

  const swapCurrencies = () => [
    setFromCurrency(toCurrency),
    setToCurrency(fromCurrency),
  ];

  const formatOptionLabel = ({
    value,
    label,
    symbol,
    isFavorite,
  }: CurrencyOption) => (
    <div className="d-flex align-items-center">
      <img
        src={`https://flagcdn.com/24x18/${value.slice(0, 2).toLowerCase()}.png`}
        alt={value}
        className="currency-flag"
      />
      <div className="ms-2">
        <div>{label}</div>
        <div className="text-muted small">{symbol}</div>
      </div>
      <span
        className="ms-auto"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(value);
        }}
      >
        {isFavorite ? (
          <FaStar className="text-warning" />
        ) : (
          <FaRegStar className="text-muted" />
        )}
      </span>
    </div>
  );

  const toggleFavorite = (currencyCode: string) => {
    const newFavorites = favorites.includes(currencyCode)
      ? favorites.filter((c) => c !== currencyCode)
      : [...favorites, currencyCode];
    setFavorites(newFavorites);
    localStorage.setItem("favoriteCurrencies", JSON.stringify(newFavorites));
  };

  if (currencyLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading currencies...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <NavbarComponent />

      <Container className="mt-5">
        <div className="converter-container p-4 bg-white rounded-3 shadow-sm">
          <h2 className="mb-4 text-primary">Currency Converter</h2>

          <Row className="g-3 align-items-end">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  {currencies.find((c) => c.code === fromCurrency)?.symbol}
                </InputGroup.Text>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-control"
                  placeholder="Amount"
                  min="0"
                />
              </InputGroup>
            </Col>

            <Col md={4}>
              <Select
                options={currencyOptions}
                value={currencyOptions.find(
                  (opt) => opt.value === fromCurrency
                )}
                onChange={handleFromChange}
                formatOptionLabel={formatOptionLabel}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable
              />
            </Col>

            <Col md={1} className="text-center">
              <Button
                variant="outline-secondary"
                onClick={swapCurrencies}
                className="rounded-circle p-2"
              >
                <FaExchangeAlt />
              </Button>
            </Col>

            <Col md={3}>
              <Select
                options={currencyOptions}
                value={currencyOptions.find((opt) => opt.value === toCurrency)}
                onChange={handleToChange}
                formatOptionLabel={formatOptionLabel}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable
              />
            </Col>

            <Col md={12}>
              <Button
                variant="primary"
                onClick={handleConvert}
                disabled={loading}
                className="w-100 mt-3 py-2"
              >
                {loading ? <Spinner size="sm" /> : "Convert"}
              </Button>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}

          {conversionResult && (
            <div className="mt-4 p-3 bg-light rounded text-center">
              <h4 className="text-muted mb-2">Converted Amount</h4>
              <h2 className="text-success">
                {currencies.find((c) => c.code === toCurrency)?.symbol}
                {conversionResult}
              </h2>
              <small className="text-muted">
                {fromCurrency} → {toCurrency}
              </small>
            </div>
          )}
        </div>

        {favorites.length > 0 && (
          <div className="favorites-section mt-4 p-3 bg-light rounded">
            <h5>Favorite Currencies</h5>
            <div className="d-flex gap-2 flex-wrap">
              {favorites.map((code) => (
                <Button
                  key={code}
                  variant="outline-warning"
                  onClick={() => setFromCurrency(code)}
                >
                  {code} <FaStar />
                </Button>
              ))}
            </div>
          </div>
        )}

        {showChart && historicalData.length > 0 && (
          <div className="chart-container mt-5">
            <h4>Exchange Rate History (Last 30 Days)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <Line type="monotone" dataKey="rate" stroke="#8884d8" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Container>
    </div>
  );
}
