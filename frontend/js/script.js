// Add book button functionality
const addBookBtn = document.getElementById("add-book");

if (addBookBtn) {
  addBookBtn.addEventListener("click", async () => {
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;
    const pages = document.getElementById("bookPages").value;

    if (!title || !author || !pages) {
      alert("Täytä kaikki kentät ennen lisäystä!");
      return;
    }

    try {
      const response = await fetch("/api/add_book", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&pages=${encodeURIComponent(pages)}`,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Kirja lisätty onnistuneesti!");
        // After adding a book, refresh to empty input fields and update stats
        document.getElementById("bookTitle").value = "";
        document.getElementById("bookAuthor").value = "";
        document.getElementById("bookPages").value = "";
        updateFooterStats();
      } else {
        alert("Virhe: " + (result.error || "Lisäys epäonnistui"));
      }
    } catch (error) {
      console.error("Yhteysvirhe:", error);
      alert("Palvelimeen ei saatu yhteyttä.");
    }
  });
}

//  Modal, pop up window for report
const modal = document.getElementById("reportModal");
const openBtn = document.getElementById("show-report");
const closeBtn = document.getElementById("close-btn");
const modalStats = document.getElementById("modal-stats"); // Varmista, että HTML:ssä on tämä ID tekstille

// Open popup fech data from database
async function loadReport() {
  try {
    const response = await fetch("/api/stats");
    const data = await response.json();

    if (modalStats) {
      let booksRows = "";
      if (data.books && data.books.length > 0) {
        data.books.forEach((book) => {
          booksRows += `
            <tr data-id="${book.id}">
              <td class="col-title"><span class="text-val">${book.title}</span></td>
              <td class="col-author"><span class="text-val">${book.author}</span></td>
              <td class="col-pages"><span class="text-val">${book.pages}</span></td>
              <td class="col-actions">
                <button class="btn-edit" onclick="editRow(${book.id})">Muokkaa</button>
                <button class="btn-save" onclick="saveRow(${book.id})" style="display:none;">Tallenna</button>
                <button class="btn-delete" onclick="deleteRow(${book.id})">✕</button>
              </td>
            </tr>
          `;
        });
      } else {
        booksRows = `
          <tr>
            <td colspan="4" style="text-align: center;">Ei vielä lisättyjä kirjoja</td>
          </tr>
        `;
      }

      modalStats.innerHTML = `
        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th>Kirja</th>
                <th>Kirjoittaja</th>
                <th>Sivut</th>
                <th>Toiminnot</th>
              </tr>
            </thead>
            <tbody>
              ${booksRows}
            </tbody>
          </table>
        </div>
        <div class="report-summary">
          <p>Kirjoja luettu yhteensä: <strong>${data.total_books}</strong> kpl</p>
          <p>Sivuja yhteensä: <strong>${data.total_pages}</strong> s.</p>
        </div>
      `;
    }

    modal.style.display = "block";
  } catch (error) {
    console.error("Virhe tilastojen haussa:", error);
    alert("Raportin hakeminen epäonnistui.");
  }
}

// Open popup
openBtn.addEventListener("click", loadReport);

// Close popup
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
// Even clicking outside the modal closes it
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Function to edit a row
function editRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  const titleCell = row.querySelector(".col-title");
  const authorCell = row.querySelector(".col-author");
  const pagesCell = row.querySelector(".col-pages");

  const currentTitle = titleCell.querySelector(".text-val").innerText;
  const currentAuthor = authorCell.querySelector(".text-val").innerText;
  const currentPages = pagesCell.querySelector(".text-val").innerText;

  titleCell.innerHTML = `<input type="text" class="edit-input title-input" value="${currentTitle}">`;
  authorCell.innerHTML = `<input type="text" class="edit-input author-input" value="${currentAuthor}">`;
  pagesCell.innerHTML = `<input type="number" class="edit-input pages-input" value="${currentPages}" style="width: 60px;"> `;

  row.querySelector(".btn-edit").style.display = "none";
  row.querySelector(".btn-save").style.display = "inline-block";
}

// Function to save the edited row's data
async function saveRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  const newTitle = row.querySelector(".title-input").value;
  const newAuthor = row.querySelector(".author-input").value;
  const newPages = row.querySelector(".pages-input").value;

  if (!newTitle || !newAuthor || !newPages) {
    alert("Kentät eivät voi olla tyhjiä!");
    return;
  }

  try {
    const response = await fetch("/api/update_book", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `id=${id}&title=${encodeURIComponent(newTitle)}&author=${encodeURIComponent(newAuthor)}&pages=${encodeURIComponent(newPages)}`,
    });

    if (response.ok) {
      loadReport();
      updateFooterStats();
    } else {
      alert("Päivitys epäonnistui.");
    }
  } catch (error) {
    console.error("Virhe päivitettäessä:", error);
  }
}

// Function to delete a row
async function deleteRow(id) {
  if (!confirm("Haluatko varmasti poistaa tämän kirjan?")) return;

  try {
    const response = await fetch("/api/delete_book", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `id=${id}`,
    });

    if (response.ok) {
      loadReport();
      updateFooterStats();
    } else {
      alert("Poisto epäonnistui.");
    }
  } catch (error) {
    console.error("Virhe poistettaessa:", error);
  }
}
// Footer script to update stats
async function updateFooterStats() {
  try {
    const response = await fetch("/api/stats");
    const data = await response.json();

    const resultBooks = document.getElementById("result-books");
    const resultPages = document.getElementById("result-pages");

    if (resultBooks)
      resultBooks.innerText = `Kirjoja luettu: ${data.total_books}`;
    if (resultPages)
      resultPages.innerText = `Sivuja yhteensä: ${data.total_pages}`;
  } catch (error) {
    console.error("Virhe footerin tilastojen haussa:", error);
  }
}

// Update footer stats when the page loads
document.addEventListener("DOMContentLoaded", updateFooterStats);
