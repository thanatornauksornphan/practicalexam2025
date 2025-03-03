document.addEventListener("DOMContentLoaded", () => {
    const app = Vue.createApp({
        data() {
            return {
                searchQuery: "",
                borrowedBooks: [],
                showModal: false,
                modalType: "",
                activeTab: "borrow",
                borrowerID: "",
                bookID: "",
                borrowerName: "",
                returnBookID: ""
            };
        },
        methods: {
            async fetchBorrowedBooks() {
                try {
                    const response = await fetch("/api/borrowed-books");
                    const data = await response.json();
                    this.borrowedBooks = data;
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            },
            formatDate(dateStr) {
                return dateStr ? new Date(dateStr).toLocaleDateString() : "-";
            },
            openModal(type) {
                this.modalType = type;
                this.showModal = true;
            },
            closeModal() {
                this.showModal = false;
            },
            async submitBorrow() {
                if (!this.borrowerID || !this.bookID) {
                    alert("Please fill in all fields.");
                    return;
                }
                try {
                    const response = await fetch("/api/borrow", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            borrowerID: this.borrowerID,
                            bookID: this.bookID
                        })
                    });
                    if (response.ok) {
                        alert("Book borrowed successfully!");
                        this.fetchBorrowedBooks();
                        this.closeModal();
                    } else {
                        alert("Failed to borrow book.");
                    }
                } catch (error) {
                    console.error("Error borrowing book:", error);
                }
            },
            async submitReturn() {
                if (!this.returnBookID) {
                    alert("Please enter a book ID to return.");
                    return;
                }
                try {
                    const response = await fetch("/api/return", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bookID: this.returnBookID })
                    });
                    if (response.ok) {
                        alert("Book returned successfully!");
                        this.fetchBorrowedBooks();
                        this.closeModal();
                    } else {
                        alert("Failed to return book.");
                    }
                } catch (error) {
                    console.error("Error returning book:", error);
                }
            }
        },
        computed: {
            filteredBooks() {
                return this.borrowedBooks.filter(book =>
                    book.b_name.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
        },
        mounted() {
            this.fetchBorrowedBooks();
        }
    });

    app.mount("#app");
});
