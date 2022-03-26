import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { Alert, Button, Form, OverlayTrigger, Spinner } from "react-bootstrap";
import { useRutterLink } from "react-rutter-link";
import styles from "../styles/Home.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DateTime } from "luxon";

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_RUTTER_PUBLIC_KEY || "RUTTER_PUBLIC_KEY";

export default function Home() {
  const [dataFetched, setDataFetched] = React.useState(null);
  const [connectLoading, setConnectLoading] = React.useState(false);
  const [dataLoading, setDataLoading] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState("");
  const [rutterConnected, setRutterConnected] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [dataErrorMessage, setDataErrorMessage] = React.useState("");
  const [generatedData, setGeneratedData] = React.useState(null);
  const [productList, setProductList] = React.useState([]);
  const [orderList, setOrderList] = React.useState([]);
  const router = useRouter();
  const { query } = router;

  const handleExchangeToken = async (publicToken) => {
    setConnectLoading(true);
    return (
      axios
        // Calls handler method in pages/api/rutter.js
        .post("/api/rutter-exchange", {
          publicToken,
        })
        .then((response) => {
          const { data } = response;
          setAccessToken(data.accessToken);
          setRutterConnected(true);
          try {
            localStorage?.setItem("rutteraccesstoken", data.accessToken);
          } catch (e) {}
        })
        .catch((e) => {
          setErrorMessage(e?.response?.data?.error);
        })
        .finally(() => {
          setConnectLoading(false);
        })
    );
  };
  const handleGetOrdersAndProducts = async (token) => {
    setConnectLoading(true);
    return (
      axios
        // Calls handler method in pages/api/rutter.js
        .post("/api/rutter-utils", {
          token,
        })
        .then((response) => {
          setOrderList(response.data.orders);
          setProductList(response.data.products);
        })
        .catch((e) => {
          setErrorMessage(e?.response?.data?.error);
        })
    );
  };

  const handleDisconnect = () => {
    try {
      localStorage?.clear();
    } catch (e) {}
    setRutterConnected(false);
  };

  React.useEffect(() => {
    // see if we have any credentials from somewhere
    console.log(query.public_token);
    if (query.public_token) {
      // skip connect
      handleExchangeToken(query.public_token);
    }
  }, [query]);

  React.useEffect(() => {
    try {
      if (window.localStorage) {
        const rutterAccessToken = localStorage?.getItem("rutteraccesstoken");
        if (rutterAccessToken) {
          setRutterConnected(true);
          setAccessToken(rutterAccessToken);
          handleGetOrdersAndProducts(rutterAccessToken);
        }
      }
    } catch (e) {}
  }, []);

  const config = {
    publicKey: PUBLIC_KEY,
    onSuccess: (publicToken) => {
      // We call our NextJS backend API in pages/api/rutter.js
      // It exchanges the publicToken for an access_token and makes an API call to /orders/get
      handleExchangeToken(publicToken);
    },
  };
  const { open, ready, error } = useRutterLink(config);

  const handleGenerateSeed = async () => {
    setDataLoading(true);
    axios
      // Calls handler method in pages/api/rutter.js
      .post("/api/main", {
        accessToken,
      })
      .then((response) => {
        console.log(response.data);
        setGeneratedData(response.data);
      })
      .catch((e) => {
        console.log("ERR");
        setErrorMessage(e?.response?.data?.error);
      })
      .finally(() => {
        console.log("SETTING FALS");
        setDataLoading(false);
      });
  };

  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentDate = DateTime.local();
  const prevMonth = currentDate.minus({ months: 1 });
  const prevprevMonth = prevMonth.minus({ months: 1 });

  console.log(currentDate.toJSDate().getMonth());
  console.log(orderList);
  console.log(productList);
  const renderDashboard = () => {
    console.log(generatedData);

    const data = [
      {
        name: currentDate.toJSDate().getMonth(),
        uv: 4000,
        pv: 2400,
        amt: 2400,
      },
      {
        name: prevMonth.toJSDate().getMonth(),
        uv: 3000,
        pv: 1398,
        amt: 2210,
      },
      {
        name: prevprevMonth.toJSDate().getMonth(),
        uv: 2000,
        pv: 9800,
        amt: 2290,
      },
    ];
    const ordersCountData = generatedData.orderCounts.map((count) => {
      return {
        name: count.month,
        total: count.count,
        pending: count.pending,
      };
    });

    return (
      <div style={{ marginTop: 20, paddingBottom: 100 }}>
        <hr />
        <div>
          <h5>Orders Breakdown By Month</h5>
          <BarChart
            width={500}
            height={500}
            data={ordersCountData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            name="Orders Breakdown"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="total"
              name="Total Orders (All statuses)"
              fill="#8884d8"
            />
            <Bar
              dataKey="pending"
              name="Pending Orders (Unpaid)"
              fill="#2994d8"
            />
          </BarChart>
        </div>
        <div style={{ marginTop: 20 }}>
          <h5>New Products Added Per Month</h5>
          <div style={{ display: "flex" }}>
            <BarChart
              width={500}
              height={500}
              data={[
                { count: 0, name: month[prevprevMonth.toJSDate().getMonth()] },
                { count: 0, name: month[prevMonth.toJSDate().getMonth()] },
                {
                  count: generatedData.products.length,
                  name: month[currentDate.toJSDate().getMonth()],
                },
              ]}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              name="Orders Breakdown"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="New Products Added" fill="44884d8" />
            </BarChart>
            <div>
              Note: The first month of data corresponds to the date your store
              was connected.
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20 }}></div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sales Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1> Dashboard</h1>
        <div className={styles.subtitle}>
          Automatically generate a dashboard for you to track sales & optimize
          your sales process
        </div>

        <hr />
        <div>
          <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
            Connect your Ecommerce store
          </div>
          {errorMessage && (
            <Alert style={{ marginTop: 4 }} variant="danger">
              {errorMessage}
            </Alert>
          )}
          {connectLoading && <Spinner></Spinner>}
          {rutterConnected ? (
            <>
              <Alert style={{ marginTop: 4 }} variant="success">
                Store connected.
              </Alert>
              <Button onClick={handleDisconnect}>Disconnect Store</Button>
            </>
          ) : (
            <div style={{ marginTop: 2 }}>No store connected.</div>
          )}
        </div>
        {/*
        {rutterConnected && (
          <div>
            <hr />
            <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
              Generate Dashboards
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
              <Button
                size="sm"
                style={{ marginRight: 4 }}
                onClick={() => handleGenerateSeed()}
                disabled={dataLoading}
              >
                Generate Simple Dashboards
              </Button>
            </div>
          </div>
        )}
        {dataLoading && (
          <div>
            <hr />
            <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
              Top-Level Metrics
            </div>
            <div>
              These basic dashboards show your store's growth over time. Our
              team will continue to add additional dashboards in the future for
              free out of the box metrics!
            </div>
            {dataLoading ? (
              <Spinner animation="border"></Spinner>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
                {renderDashboard()}
              </div>
            )}
          </div>
        )}
        {generatedData && (
          <div>
            <div>
              {" "}
              <div style={{ marginTop: 12 }}></div>
            </div>{" "}
            {renderDashboard()}
          </div>
        )}

        {dataErrorMessage && (
          <Alert style={{ marginTop: 8 }} variant="danger">
            {dataErrorMessage}
          </Alert>
        )}*/}
      </main>
    </div>
  );
}
