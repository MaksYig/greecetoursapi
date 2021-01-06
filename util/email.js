const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email{
  constructor(user, url){
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Greece Tours <${process.env.EMAIL_FROM}>`;
  }

  newTransport(){
    if (process.env.NODE_ENV == 'production'){
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth:{
          user: process.env.SENDGRID_USERNAME,
          pass:process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth:{
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject){
    //Render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );
    //Email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: htmlToText.fromString(html),
      html:html
    };
    //create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // Mails options to send
  async sendWelcome(){
    await this.send('welcome','Welcome to Greece tours Comunity!!');
  }
  async sendPasswordReset(){
    await this.send('passwordReset','Please reset your password (token valid only 10 minutes');
  }
  async sendBookingTour(){
    await this.send('passwordReset','Thank you for booking Tour with us!!');
  }

};