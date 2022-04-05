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
  ResponsiveContainer,
} from "recharts";

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
          handleGetOrdersAndProducts(data.accessToken);
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
  //const { open, ready, error } = useRutterLink(config);
  const productNames = productList.map((item) => {
    return {
      name: item.name,
      id: item.id,
      total: null,
    };
  });

  orderList.forEach((item) => {
    productNames.forEach((prod, index) => {
      if (
        item.line_items.filter((e) => {
          return e.product_id === prod.id;
        }).length > 0
      ) {
        productNames[index] = { ...prod, [item.id]: item.id };
      }
    });
  });
  for (const val of productNames) {
    let orderCount = Object.keys(val).length;
    if (orderCount > 3) val.total = orderCount - 3;
  }

  console.log(productNames);
  const renderProductsGraph = () => {
    const ordersExist = productList.length > 0 && orderList.length > 0;
    return (
      <div style={{ marginTop: 20, paddingBottom: 100 }}>
        <hr />
        <div>
          {ordersExist && (
            <>
              <div align={"center"}>
                <h5>90-Day Order Breakdown By Product</h5>
              </div>

              <ResponsiveContainer width={"100%"} height={700}>
                <BarChart
                  width={700}
                  height={500}
                  data={productNames}
                  layout={"vertical"}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 5,
                  }}
                  name="Orders Breakdown"
                >
                  <XAxis type={"number"} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <YAxis
                    dataKey="name"
                    interval={0}
                    type={"category"}
                    width={180}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total"
                    name="Total Orders (All statuses)"
                    fill="#8884d8"
                    label
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
          {!ordersExist && (
            <Alert style={{ marginTop: 4 }} variant="danger">
              No orders and products were found for this store. To use this app
              and generate a 90-Day order breakdown, connect a store with both
              existing products and orders.
            </Alert>
          )}
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
            <div style={{ marginTop: 2, marginBottom: 2 }}>
              No store connected.
            </div>
          )}
        </div>

        {rutterConnected && (
          <div>
            <hr />
            <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
              Generate 90-Day Order Breakdown
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
              <Button
                size="sm"
                style={{ marginRight: 4 }}
                onClick={() => {
                  setGeneratedData(true);
                }}
                variant={"success"}
                disabled={dataLoading}
              >
                Generate Order Breakdown
              </Button>
            </div>
          </div>
        )}
        {generatedData && (
          <div>
            <div>
              {" "}
              <div style={{ marginTop: 12 }}></div>
            </div>{" "}
            {renderProductsGraph()}
          </div>
        )}

        {dataErrorMessage && (
          <Alert style={{ marginTop: 8 }} variant="danger">
            {dataErrorMessage}
          </Alert>
        )}
      </main>
    </div>
  );
}
