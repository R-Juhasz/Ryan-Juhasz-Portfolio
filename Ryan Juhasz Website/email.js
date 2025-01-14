
// Email contact form section
// All needed elements for the DOM
const contactForm = document.querySelector(".contact");
const submitbtn = document.querySelector(".submit");
const nameInput = document.querySelector("#user_name");
const emailInput = document.querySelector("#email");
const subjectInput = document.querySelector("#subject"); // Corrected from .subject to #subject if it's an ID
const messageInput = document.querySelector("#MESSAGE");

//get needed data from emailjs
const publickey = "zozvs3t7x3zW1HCCW";
const serviceID = "service_7xy2owg";
const templateID = "template_9jrhge8";

//initialize emailjs with publickey
emailjs.init(publickey);

//add submit event to the form
contactForm.addEventListener("submit", e => {

  //prevent form default behavior
  e.preventDefault();
  //change button text
  submitbtn.innerText = "Just a moment...";
  //get all input field values
  const inputFields = {
    name: nameInput.value,
    email: emailInput.value,
    subject: subjectInput.value,
    message: messageInput.value,
  }
  /* send the email
  (add service, template id and inputfield values)*/
  emailjs.send(serviceID, templateID, inputFields)
  .then(() => {
    //change button text
    submitbtn.innerText = "Message sent successfully";
    // Clear out all input fields
    nameInput.value = "";
    emailInput.value = "";
    subjectInput.value = "";
    messageInput.value = "";
    // Reset button text after 3 seconds
    setTimeout(() => {
      submitbtn.innerText = "Send Message";
    }, 3000);
  },(error) => {
    //console log the error
    console.log(error);
    // Optionally, alert the user
    alert("Sorry, something went wrong. Please try again.");
    //change button text
    submitbtn.innerText = "Something went wrong";
  });
});
