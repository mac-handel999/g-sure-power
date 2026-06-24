// public/app.js

document.addEventListener("DOMContentLoaded", () => {
  const reviewsContainer = document.getElementById("reviewsContainer");
  const reviewForm = document.getElementById("reviewForm");

  // ==========================================
  // FUNCTION: FETCH & DISPLAY REVIEWS
  // ==========================================
  async function loadReviews() {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error("Network issues fetching database items.");
      
      const reviews = await response.json();
      reviewsContainer.innerHTML = ""; // Wipe loading text

      if (reviews.length === 0) {
        reviewsContainer.innerHTML = `<p class="loading-text">No reviews published yet. Be the first to leave one below!</p>`;
        return;
      }

      reviews.forEach(review => {
        // Construct visual HTML star representation strings dynamically
        let starContainer = "";
        for (let i = 1; i <= 5; i++) {
          if (i <= review.rating) {
            starContainer += `<i class="fa-solid fa-star"></i>`;
          } else {
            starContainer += `<i class="fa-regular fa-star"></i>`;
          }
        }

        const cardHTML = `
          <div class="review-card">
            <div class="review-header">
              <span class="review-client-name">${escapeHTML(review.name)}</span>
              <span class="review-stars">${starContainer}</span>
            </div>
            <div class="review-tag"><i class="fa-solid fa-circle-check"></i> ${escapeHTML(review.service)}</div>
            <p class="review-text">"${escapeHTML(review.comment)}"</p>
          </div>
        `;
        reviewsContainer.insertAdjacentHTML('beforeend', cardHTML);
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      reviewsContainer.innerHTML = `<p class="loading-text" style="color: #e74c3c;">Failed to load dynamic reviews feed right now.</p>`;
    }
  }

  // ==========================================
  // FUNCTION: HANDLE SUBMISSION SUBMIT EVENT
  // ==========================================
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("custName").value;
    const service = document.getElementById("serviceType").value;
    const comment = document.getElementById("custComment").value;
    
    // Grabs checked value inside modern query selectors safely
    const ratingRadio = document.querySelector('input[name="rating"]:checked');
    if (!ratingRadio) {
      alert("Please select a star rating!");
      return;
    }
    const rating = ratingRadio.value;

    const payload = { name, service, rating, comment };

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        alert("Success! Thank you for your feedback.");
        reviewForm.reset();
        loadReviews(); // Instant dynamic re-render update
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Could not process submit transmission over web pipelines.");
    }
  });

  // Helper utility function preventing Cross-Site Scripting (XSS injections) inside textual strings
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Initial Run Call Load execution
  loadReviews();
});