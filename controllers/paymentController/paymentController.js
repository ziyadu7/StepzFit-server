
const Stripe = require('stripe')
const planModel = require('../../models/planModels/planModel')
const subscriptionModel = require('../../models/planModels/subscriptionModel')
const userModel = require('../../models/userSideModels/userModel')
require('dotenv').config()

const stripe = Stripe(process.env.STRIPE_KEY)



const subscribePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.payload.id;
    const plan = await planModel.findById(planId);
    const userData = await userModel.findById(userId);
    const amount = plan.price;

    const currentDate = new Date();
    const startDate = currentDate;
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 30);

    const existingSubscription = await subscriptionModel.findOne({ user: userId, expired: false }).populate('plan')
    if (existingSubscription) {
      return res.status(409).json({ errMsg: `Already Subscribed to ${existingSubscription?.plan?.name}` });
    } else {
      const user = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId: userId,
          planId: planId,
          startDate: startDate,
          endDate: endDate,
          amount: amount,
        },
      });

      const session = await stripe.checkout.sessions.create({
        customer: user.id,
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: plan.name,
                metadata: {
                  id: planId,
                },
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.BACKENDURL}/payment/paymentSuccess?userId=${userId}&planId=${planId}&amount=${amount}&startDate=${startDate}&endDate=${endDate}`,
        cancel_url: `${process.env.BACKENDURL}/payment/paymentFail`,
      });
      res.send({ url: session.url });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ errMsg: "Server Error" });
  }
};


const paymentSuccess = async (req, res) => {
  try {

    const { planId, startDate, endDate, userId } = req.query
    await subscriptionModel.create({
      user: userId,
      plan: planId,
      startDate: startDate,
      endDate: endDate,
    })

    await subscriptionModel.updateOne({ user: userId, plan: planId, startDate: startDate, endDate: endDate })

    res.redirect(`${process.env.FRONTENDURL}/paymentSuccess`)
  } catch (error) {
    res.status(500).json({ errMsg: 'Server Error' })
    console.log(error);
  }
}

/////////////PAYMENT FAIL///////////////

const paymentFail = async (req, res) => {
  try {

    res.redirect(`${process.env.FRONTENDURL}/paymentFailed`)
  } catch (error) {
    res.status(500).json({ errMsg: 'Server Error' })
    console.log(error);
  }
}


module.exports = {
  subscribePlan,
  paymentSuccess,
  paymentFail,
}