import axios from "axios";

const ENV_URL = process.env.RUTTER_URL || "production.rutterapi.com";
const CLIENT_ID = process.env.RUTTER_CLIENT_ID || "RUTTER_CLIENT_ID";
const SECRET = process.env.RUTTER_SECRET || "RUTTER_SECRET";

const auth_token = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");
export default async (req, res) => {
  let orders = null;
  let products = null;
  console.log(req.body);
  const { token } = req.body;
  const options = {
    method: "GET",
    url:
      "https://" +
      ENV_URL +
      "/orders?access_token=" +
      token,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth_token}`,
    },
  };

  await axios
    .request(options)
    .then((response) => {
      console.log(response.data.orders);
      orders = response.data.orders;
    })
    .catch((error) => {
      console.error(error);
    });
  const productOptions = {
    method: "GET",
    url: "https://" + ENV_URL + "/products?access_token=" + token+"&fulfillment_status=any",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth_token}`,
    },
  };

  await axios
    .request(productOptions)
    .then((response) => {
      console.log(response.data);
      products = response.data.products;
    })
    .catch((error) => {
      console.error(error);
    });

  return res.status(200).json({ orders, products });
};
