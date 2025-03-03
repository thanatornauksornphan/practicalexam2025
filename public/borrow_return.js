document.addEventListener("DOMContentLoaded", () => {
    const app = Vue.createApp({
        data() {
            return {
                searchQuery: "",
                borrowedBooks: [],
                showModal: false,
                modalType: "",
                activeTab: "borrow",

                // Borrow form fields
                borrowerId: "",
                borrowerName: "",
                bookId: "",
                bookName: "",
                formSubmitted: false,
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
        openModal(type) {
            this.modalType = type;
            this.showModal = true;
            this.resetForm();
        },
        closeModal() {
            this.showModal = false;
        },
        resetForm() {
            this.borrowerId = "";
            this.borrowerName = "";
            this.bookId = "";
            this.bookName = "";
            this.formSubmitted = false;
        },
        async submitForm() {
            if (!this.borrowerId || !this.bookId) {
                alert("กรุณากรอกข้อมูลให้ครบถ้วน (Please fill in both fields.)");
                return;
            }
            try {
                const borrowerResponse = await fetch(`/api/member/${this.borrowerId}`);
                const bookResponse = await fetch(`/api/book/${this.bookId}`);

                const borrowerData = await borrowerResponse.json();
                const bookData = await bookResponse.json();

                if (borrowerData.success && bookData.success) {
                    this.borrowerName = borrowerData.data.m_name;
                    this.bookName = bookData.data.b_name;
                    this.formSubmitted = true;
                } else {
                    alert("ไม่พบข้อมูลสมาชิกหรือหนังสือ (Member or book not found.)");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        },
        async submitBorrow() {
            if (!this.formSubmitted) {
                alert("กรุณายืนยันข้อมูลก่อน (Please confirm the data first.)");
                return;
            }

            try {
                const response = await fetch("/api/borrow-book", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        borrowerId: this.borrowerId,
                        bookId: this.bookId,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    alert("บันทึกข้อมูลเรียบร้อย (Data saved successfully.)");
                    this.fetchBorrowedBooks();
                    this.closeModal();
                } else {
                    alert("มีข้อผิดพลาดเกิดขึ้น (An error occurred.)");
                }
            } catch (error) {
                console.error("Error saving data:", error);
            }
        },
        computed: {
            filteredBooks() {
                return this.borrowedBooks.filter(book =>
                    book.b_name.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            },
            canSubmitBorrow() {
                return this.formSubmitted;
            },
        },
        mounted() {
            this.fetchBorrowedBooks();
        }
    });

    app.mount("#app");
});
