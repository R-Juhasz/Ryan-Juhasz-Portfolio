$(document).ready(function () {



  //sticky header
  $(window).scroll(function () {
    // Trigger animation on every scroll event
    $(".header-area").fadeIn(); // Example animation

    // Update the active section in the header
    updateActiveSection();
  });

  // Handle click events on header links
  $(".header ul li a").click(function (e) {
    e.preventDefault();

    var target = $(this).attr("href");

    // Check if the target section is already active
    if ($(target).hasClass("active-section")) {
      return;
    }

    // Scroll to the target section
    if (target === "#home") {
      // Scroll to the top of the page for the home section
      $("html, body").animate(
        {
          scrollTop: 0
        },
        500
      );
    } else {
      // Scroll to the target section with an offset
      var offset = $(target).offset().top - 40;

      $("html, body").animate(
        {
          scrollTop: offset
        },
        500
      );
    }

    // Update active class for header links
    $(".header ul li a").removeClass("active");
    $(this).addClass("active");
  });

  // Initialize content revealing animation with ScrollReveal.js
  ScrollReveal({
    distance: "100px",
    duration: 2000,
    delay: 200
  });

  // Define reveal animations for different sections
  ScrollReveal().reveal(".header a, .profile-photo, .about-content", {
    origin: "left"
  });
  ScrollReveal().reveal(".header ul, .profile-text, .about-skills", {
    origin: "right"
  });
  ScrollReveal().reveal(".project-title, .contact-title", {
    origin: "top"
  });
  ScrollReveal().reveal(".projects, .contact", {
    origin: "bottom"
  });

  // Handle form submission to Google Sheets
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzUSaaX3XmlE5m9YLOHOBrRuCh2Ohv49N9bs4bew7xPd1qlgpvXtnudDs5Xhp3jF-Fx/exec";
  const form = document.forms["submitToGoogleSheet"];
  const msg = document.getElementById("msg");

  form.addEventListener("submit", e => {
    e.preventDefault(); // Prevent form submission

    // Send form data to Google Sheets
    fetch(scriptURL, { method: "POST", body: new FormData(form) })
      .then(response => {
        // Display success message and reset the form after submission
        msg.innerHTML = "Message sent successfully";
        setTimeout(function () {
          msg.innerHTML = "";
        }, 5000);
        form.reset();
      })
      .catch(error => console.error("Error!", error.message));
  });

  // Function to update the active section in the header
  function updateActiveSection() {
    var scrollPosition = $(window).scrollTop();

    // Checking if scroll position is at the top of the page
    if (scrollPosition === 0) {
      $(".header ul li a").removeClass("active");
      $(".header ul li a[href='#home']").addClass("active");
      return;
    }
    // returns to top of page whem reloaded
    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    };

    // Iterate through each section and update the active class in the header
    $("section").each(function () {
      var target = $(this).attr("id");
      var offset = $(this).offset().top;
      var height = $(this).outerHeight();



      if (
        scrollPosition >= offset - 40 &&
        scrollPosition < offset + height - 40
      ) {
        $(".header ul li a").removeClass("active");
        $(".header ul li a[href='#" + target + "']").addClass("active");
      }
    });
  }
});
function menuOnClick() {
  document.getElementById("menu-bar").classList.toggle("change");
  document.getElementById("nav").classList.toggle("change");
  document.getElementById("menu-bg").classList.toggle("change-bg");
}
