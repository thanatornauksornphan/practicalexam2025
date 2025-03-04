const { createApp, ref, onMounted } = Vue;

const app = Vue.createApp({
    setup() {
        const books = ref([]);
        const searchQuery = ref("");
        const borrowModal = ref(null);
        const isModalOpen = ref(false);
        const isBorrowMode = ref(true);
        const bookName = ref("");
        const newEntry = ref({
            b_id: '',
            m_user: '',
            borrow_date: new Date().toISOString().substr(0, 10),
            return_date: '',
            fine: 0
        });

        const tempEntries = ref([]);

        // Fetch all borrowed books from the API
        const fetchAllBooks = async () => {
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
            try {
                const response = await axios.get(`/api/borrowed-books?search=${searchQuery.value}`);
                books.value = response.data;
            } catch (error) {
                console.error('Error searching books:', error);
                alert('ไม่สามารถค้นหาข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            }
        };

        // Show the borrow modal
        const showBorrowModal = () => {
            isModalOpen.value = true;
            isBorrowMode.value = true;
            clearEntry();
            tempEntries.value = [];
        };

        // Switch between Borrow and Return mode
        const toggleMode = (mode) => {
            isBorrowMode.value = mode === 'borrow';
            isBorrowMode.value = mode === 'return';
            clearEntry();
        };

        // Add user or book ID to the table
        const addToTable = (type) => {
            if (type === 'm_user' && newEntry.value.m_user.trim() === '') return;
            if (type === 'b_id' && newEntry.value.b_id.trim() === '') return;

            if (type === 'b_id') {
                try {
                    const response = axios.get(`/api/books/${newEntry.value.b_id}`);
                    bookName.value = response.data.name || 'ไม่พบข้อมูลหนังสือ';
                } catch (error) {
                    console.error('Error fetching book:', error);
                    bookName.value = 'ไม่สามารถโหลดข้อมูลหนังสือได้';
                }
            }
        };

        const addEntryToTable = () => {
            if (!newEntry.value.b_id || (isBorrowMode.value && !newEntry.value.m_user)) {
                alert("กรุณากรอกข้อมูลให้ครบถ้วน");
                return;
            }

            tempEntries.value.push({
                b_id: newEntry.value.b_id,
                b_name: bookName.value,
                m_user: isBorrowMode.value ? newEntry.value.m_user : 'N/A',
            });

            clearEntry();
        };

        // Save Borrow/Return data
        const saveBorrowReturn = async () => {
            if (tempEntries.value.length === 0) {
                alert("ไม่มีข้อมูลที่ต้องบันทึก");
                return;
            }
        
            try {
                for (const entry of tempEntries.value) {
                    const payload = {
                        b_id: entry.b_id,
                        b_name: entry.b_name,
                        m_user: isBorrowMode.value ? entry.m_user : null,
                        action: isBorrowMode.value ? 'borrow' : 'return'
                    };
                    
                    console.log('Sending payload:', payload);
                    
                    try {
                        const response = await axios.post('/api/borrow-return', payload);
                        console.log('Success for entry:', entry.b_id, response.data);
                    } catch (entryError) {
                        console.error('Failed for entry:', entry.b_id, entryError);
                        // Continue with other entries even if one fails
                        throw entryError; // Re-throw to handle in outer catch
                    }
                }
        
                alert('บันทึกข้อมูลสำเร็จ');
                isModalOpen.value = false;
                tempEntries.value = []; // Clear table after saving
                fetchAllBooks();
            } catch (error) {
                console.error('Error saving borrow:', error);
                
                if (error.response) {
                    // The server responded with an error status
                    console.error('Server error details:', error.response.data);
                    console.error('Status code:', error.response.status);
                    alert(`ไม่สามารถบันทึกข้อมูลได้: ${error.response.data.message || error.response.data || 'Server error'}`);
                } else {
                    alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
                }
            }
        };


        // Clear input fields
        const clearEntry = () => {
            newEntry.value = { b_id: '', m_user: '' };
            bookName.value = '';
            newEntry.value.borrow_date = new Date().toISOString().substr(0, 10);
            newEntry.value.return_date = '';
            newEntry.value.fine = 0;
        };

        // Format date to YYYY-MM-DD
        const formatDate = (dateString) => {
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

        // Dummy function for statistics
        const statistics = () => {
            console.log('Statistics button clicked');
        };

        onMounted(() => {
            fetchAllBooks();
        });

        return {
            isModalOpen,
            isBorrowMode,
            newEntry,
            tempEntries,
            showBorrowModal,
            addEntryToTable,
            saveBorrowReturn,
            clearEntry,
            books,
            searchQuery,
            searchBooks,
            toggleMode,
            addToTable,
            formatDate,
            statistics,
            bookName,
        };
    }
});

// Mount the app
document.addEventListener('DOMContentLoaded', () => {
    app.mount('#app');
});