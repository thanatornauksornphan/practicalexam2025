document.addEventListener("DOMContentLoaded", () => {
    const app = Vue.createApp({
        data() {
            return {
                searchQuery: "",
                borrowedBooks: [],
                showModal: false,
                modalType: "",
                activeTab: "borrow",
                borrowerName: "",
                bookID: "",
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
            submitBorrow() {
                if (this.borrowerName && this.bookID) {
                    alert(`Borrow request submitted for ${this.borrowerName} (Book ID: ${this.bookID})`);
                    this.borrowerName = "";
                    this.bookID = "";
                } else {
                    alert("Please enter all details!");
                }
            },
            submitReturn() {
                if (this.returnBookID) {
                    alert(`Return request submitted for Book ID: ${this.returnBookID}`);
                    this.returnBookID = "";
                } else {
                    alert("Please enter a Book ID!");
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