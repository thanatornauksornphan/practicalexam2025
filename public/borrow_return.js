document.addEventListener("DOMContentLoaded", () => {
    const app = Vue.createApp({
        data() {
            return {
                searchQuery: "",
                borrowedBooks: []
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
