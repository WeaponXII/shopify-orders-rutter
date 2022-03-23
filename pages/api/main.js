import axios from "axios";
const Shopify = require("shopify-api-node");
const { DateTime } = require("luxon");

const ENV_URL = process.env.RUTTER_URL || "production.rutterapi.com";
const CLIENT_ID = process.env.RUTTER_CLIENT_ID || "RUTTER_CLIENT_ID";
const SECRET = process.env.RUTTER_SECRET || "RUTTER_SECRET";

export default async (req, res) => {
  if (req.method === "POST") {
    // Process a POST request
    const { accessToken } = req.body;
    // Exchange publictoken for access_token
    try {
      console.log("FIRE IT");
      const response = await axios.get(
        `https://${ENV_URL}/connections/credentials?access_token=${accessToken}`,
        {
          auth: {
            username: CLIENT_ID,
            password: SECRET,
          },
        }
      );
      const { credential } = response.data;
      const { access_token, store_url } = credential;
      const connectionResponse = await axios.get(
        `https://${ENV_URL}/connections/access_token?access_token=${accessToken}`,
        {
          auth: {
            username: CLIENT_ID,
            password: SECRET,
          },
        }
      );
      const {
        connection: { store_unique_id },
      } = connectionResponse.data;
      console.log({
        shopName: store_url,
        accessToken: access_token,
      })
      const shopify = new Shopify({
        shopName: store_url,
        accessToken: access_token,
      });
      // orders
      var today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
      const luxonLastDayOfMonth = DateTime.fromJSDate(lastDayOfMonth);
      console.log(luxonLastDayOfMonth.toISO())
      const lastLastMonthOrders = await shopify.order.count({
        created_at_min: luxonLastDayOfMonth.minus({ months: 3 }).toUTC().toISO(),
        created_at_max: luxonLastDayOfMonth.minus({ months: 2 }).toUTC().toISO(),
      });
      const lastMonthOrders = await shopify.order.count({
        created_at_min: luxonLastDayOfMonth.minus({ months: 2 }).toUTC().toISO(),
        created_at_max: luxonLastDayOfMonth.minus({ months: 1 }).toUTC().toISO(),
      });
      const thisMonthOrders = await shopify.order.count({
        created_at_min: luxonLastDayOfMonth.minus({ months: 1 }).toUTC().toISO(),
        created_at_max: luxonLastDayOfMonth.toUTC().toISO(),
      });
      const lastLastMonthOrdersPending = await shopify.order.count({
        financial_status: "pending",

        created_at_min: luxonLastDayOfMonth.minus({ months: 3 }).toUTC().toISO(),
        created_at_max: luxonLastDayOfMonth.minus({ months: 2 }).toUTC().toISO(),
      });
      const lastMonthOrdersPending = await shopify.order.count({
        financial_status: "pending",

        created_at_min: luxonLastDayOfMonth.minus({ months: 2 }).toUTC().toISO(),
        created_at_max: luxonLastDayOfMonth.minus({ months: 1 }).toUTC().toISO(),
      });
      const thisMonthOrdersPending = await shopify.order.count({
        financial_status: "pending",
        created_at_min: luxonLastDayOfMonth.minus({ months: 1 }).toUTC().toISO(),
        created_at_max: luxonLastDayOfMonth.toUTC().toISO(),
      });

      const orders = await shopify.order.list();
      const products = await shopify.product.list();
      // const customers = await shopify.customer.list();

      console.log(orders);

      const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const currentDate = DateTime.local()
      const prevMonth = currentDate.minus({ months: 1 })
      const prevprevMonth = prevMonth.minus({ months: 1 })

      return res.status(200).json({
        orders,
        orderCounts: [
          {
            month: month[prevprevMonth.toJSDate().getMonth()],
            count: lastLastMonthOrders,
            pending: lastLastMonthOrdersPending,
          },
          {
            month: month[prevMonth.toJSDate().getMonth()],
            count: lastMonthOrders,
            pending: lastMonthOrdersPending,
          },
          {
            month: month[currentDate.toJSDate().getMonth()],
            count: thisMonthOrders,
            pending: thisMonthOrdersPending,
          },
        ],
        products,
        // customers,
      });
    } catch (err) {
      console.error(err);
      return res.status(500);
    }
  } else {
    // Handle any other HTTP method
    return res.status(401).json({
      error_message: "Unauthorized Method",
    });
  }
};
