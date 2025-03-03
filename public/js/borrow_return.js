const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const books = ref([]);
        const searchQuery = ref("");
        const borrowModal = ref(null);
        const newBorrow = ref({
            b_id: '',
            m_user: '',
            borrow_date: new Date().toISOString().substr(0, 10),
            return_date: '',
            fine: 0
        });

        // Fetch all borrowed books from the API
        const FetchAllBooks = async () => {
            try {
                const response = await axios.get('/api/borrowed-books');
                books.value = response.data;
            } catch (error) {
                console.error('Error fetching books:', error);
                alert('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            }
        };

        // Search for books by query
        const searchBooks = async () => {
            if (!searchQuery.value) {
                FetchAllBooks();
                return;
            }

            try {
                const response = await axios.get(`/api/borrowed-books?search=${searchQuery.value}`);
                const allBooks = response.data;

                books.value = allBooks.filter(book => {
                    book.b_id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        book.b_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        book.m_name.toLowerCase().includes(searchQuery.value.toLowerCase())
                });
            } catch (error) {
                console.error('Error searching books:', error);
                alert('ไม่สามารถค้นหาข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            }
        };

        // Show the borrow modal
        const showBorrowModal = () => {
            const modal = new bootstrap.Modal(document.getElementById('borrowModal'));
            modal.show();
            borrowModal.value = modal;
        };

        // Save a new borrow record
        const saveBorrowReturn = async () => {
            try {
                console.log('Would save : ', newBorrow.value);
                alert('บันทึกข้อมูลสำเร็จ');

                if (borrowModal.value) {
                    borrowModal.value.hide();
                }

                // Reset form
                newBorrow.value = {
                    b_id: '',
                    m_user: '',
                    borrow_date: new Date().toISOString().substr(0, 10),
                    return_date: '',
                    fine: 0
                };

                fetchAllBooks();
            } catch (error) {
                console.error('Error saving borrow:', error);
                alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            }
        };

        // Format date to YYYY-MM-DD
        const formatDate = (date) => {
            if (!dateString || dateString === '0000-00-00') return '-';

            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        };

        // Fetch all books when the component is mounted
        onMounted(() => {
            fetchAllBooks();
        });

        return {
            books,
            searchQuery,
            newBorrow,
            fetchAllBooks,
            searchBooks,
            showBorrowModal,
            saveBorrowReturn,
            formatDate
        };
    }
}).mount('#app');