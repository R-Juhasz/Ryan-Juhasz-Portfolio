// ----------------------------------------------
// Rotating Projects Carousel
// ----------------------------------------------
const container = document.querySelector('.image-container');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const projects = document.querySelectorAll('.image-container span');

let currentRotation = 0;
// The index of the project whose info is visible.
let activeIndex = 2;

// Show/hide descriptions based on active index
function updateDescriptions() {
  projects.forEach((project, index) => {
    const info = project.querySelector('.project-info');
    if (index === ((activeIndex % projects.length) + projects.length) % projects.length) {
      info.classList.add('visible');
    } else {
      info.classList.remove('visible');
    }
  });
}

// Next/Prev Button Handlers
if (prevBtn && nextBtn && container && projects.length > 0) {
  prevBtn.addEventListener('click', () => {
    currentRotation += 120;
    activeIndex = (activeIndex - 1 + projects.length) % projects.length;
    container.style.transform = `perspective(1000px) rotateY(${currentRotation}deg)`;
    updateDescriptions();
  });

  nextBtn.addEventListener('click', () => {
    currentRotation -= 120;
    activeIndex = (activeIndex + 1) % projects.length;
    container.style.transform = `perspective(1000px) rotateY(${currentRotation}deg)`;
    updateDescriptions();
  });
}

// Initialize descriptions on load
updateDescriptions();

// ----------------------------------------------
// Email Contact Form + Google Sheets Submission
// ----------------------------------------------
const contactFormEl = document.querySelector('#contact_form');
const submitBtn = document.querySelector('.submit');

const nameInput = document.querySelector('#user_name');
const emailInput = document.querySelector('#email');
const subjectInput = document.querySelector('#subject');
const messageInput = document.querySelector('#message');

const publicKey = 'zozvs3t7x3zW1HCCW';   // EmailJS Public Key
const serviceID = 'service_7xy2owg';    // EmailJS Service ID
const templateID = 'template_9jrhge8';  // EmailJS Template ID

// Google Sheets Info
const scriptURL = 'https://script.google.com/macros/s/AKfycbzUSaaX3XmlE5m9YLOHOBrRuCh2Ohv49N9bs4bew7xPd1qlgpvXtnudDs5Xhp3jF-Fx/exec';
const msgEl = document.getElementById('msg');

// Initialize EmailJS
emailjs.init(publicKey);

// Handle Contact Form Submission to both EmailJS & Google Sheets
if (contactFormEl) {
  contactFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.innerText = 'Just a moment...';

    // Prepare input fields for EmailJS
    const inputFields = {
      name: nameInput.value,
      email: emailInput.value,
      subject: subjectInput.value,
      message: messageInput.value,
    };

    // 1) Send via EmailJS
    emailjs.send(serviceID, templateID, inputFields)
      .then(() => {
        // 2) Also send data to Google Sheets
        fetch(scriptURL, { method: 'POST', body: new FormData(contactFormEl) })
          .then(() => {
            // Success for both
            submitBtn.innerText = 'Message sent successfully';
            msgEl.innerHTML = 'Message sent successfully!';
            setTimeout(() => {
              msgEl.innerHTML = '';
              submitBtn.innerText = 'Send Message';
            }, 3000);

            // Clear form fields
            contactFormEl.reset();
          })
          .catch((error) => {
            console.error('Google Sheets Error!', error.message);
            alert('Sorry, something went wrong (Google Sheets). Please try again.');
            submitBtn.innerText = 'Send Message';
          });
      })
      .catch((error) => {
        console.error('EmailJS Error!', error);
        alert('Sorry, something went wrong (EmailJS). Please try again.');
        submitBtn.innerText = 'Send Message';
      });
  });
}

// ----------------------------------------------
// jQuery and ScrollReveal Initialization
// ----------------------------------------------
$(document).ready(function () {
  // Sticky Header
  $(window).scroll(function () {
    $('.header-area').fadeIn();
    updateActiveSection();
  });

  // Smooth Scrolling for Navbar Links
  $('.header ul li a').click(function (e) {
    e.preventDefault();
    const target = $(this).attr('href');

    // If already on the correct section, do nothing
    if ($(target).hasClass('active-section')) return;

    if (target === '#home') {
      $('html, body').animate({ scrollTop: 0 }, 500);
    } else {
      const offset = $(target).offset().top - 40;
      $('html, body').animate({ scrollTop: offset }, 500);
    }

    $('.header ul li a').removeClass('active');
    $(this).addClass('active');
  });

  // ScrollReveal Animations
  ScrollReveal({ distance: '100px', duration: 2000, delay: 200 });
  ScrollReveal().reveal('.header a, .profile-photo, .about-content', { origin: 'left' });
  ScrollReveal().reveal('.header ul, .profile-text, .about-skills', { origin: 'right' });
  ScrollReveal().reveal('.project-title, .contact-title', { origin: 'top' });
  ScrollReveal().reveal('.projects, .contact', { origin: 'bottom' });

  // Force scroll to top on reload (optional)
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };

  // Update Active Section in Header
  function updateActiveSection() {
    const scrollPosition = $(window).scrollTop();

    // If at the very top, highlight "Home"
    if (scrollPosition === 0) {
      $('.header ul li a').removeClass('active');
      $(".header ul li a[href='#home']").addClass('active');
      return;
    }

    $('section').each(function () {
      const target = $(this).attr('id');
      const offset = $(this).offset().top;
      const height = $(this).outerHeight();

      if (scrollPosition >= offset - 40 && scrollPosition < offset + height - 40) {
        $('.header ul li a').removeClass('active');
        $(`.header ul li a[href='#${target}']`).addClass('active');
      }
    });
  }
});

// ----------------------------------------------
// Mobile Menu Toggle (single version)
// ----------------------------------------------
const menuIcon = document.querySelector('.menu_icon');
const navbar = document.querySelector('.navbar');

if (menuIcon && navbar) {
  menuIcon.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });
}

// ----------------------------------------------
// Handle touch interactions for carousel
// ----------------------------------------------
if (container) {
  container.addEventListener('touchstart', handleTouchStart, false);
  container.addEventListener('touchmove', handleTouchMove, false);

  let xDown = null;

  function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
  }

  function handleTouchMove(evt) {
    if (!xDown) return;

    let xUp = evt.touches[0].clientX;
    let xDiff = xDown - xUp;

    if (xDiff > 0) {
      // Swipe left -> next
      if (nextBtn) nextBtn.click();
    } else {
      // Swipe right -> previous
      if (prevBtn) prevBtn.click();
    }
    xDown = null;
  }
}

// ----------------------------------------------
// Close Navbar When Clicking Outside (mobile)
// ----------------------------------------------
document.addEventListener('click', (event) => {
  // Only run if we have the .menu_icon and .navbar
  if (!menuIcon || !navbar) return;

  const isClickInsideMenu =
    menuIcon.contains(event.target) || navbar.contains(event.target);

  if (!isClickInsideMenu && navbar.classList.contains('active')) {
    navbar.classList.remove('active');
  }
});

