const { createApp, ref, onMounted } = Vue;

const app = Vue.createApp({
    setup() {
        const books = ref([]);
        const searchQuery = ref("");
        const isModalOpen = ref(false);
        const isBorrowMode = ref(true);
        const bookName = ref("");
        const newEntry = ref({
            b_id: '',
            b_name: '',
            m_user: '',
            borrow_date: new Date().toISOString().substr(0, 10),
            return_date: '',
            fine: 0
        });

        const tempEntries = ref([]);
        const returnBookId = ref("");
        const returnEntry = ref(null);

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

        // Fetch book details when returning
        const fetchReturnDetails = async () => {
            if (!returnBookId.value.trim()) {
                alert('กรุณากรอกหมายเลขหนังสือที่ต้องการคืน');
                return;
            }

            try {
                const response = await axios.get(`/api/borrow-return/${returnBookId.value}`);
                if (response.data) {
                    returnEntry.value = response.data;
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    alert('ไม่พบข้อมูลการยืมหนังสือเล่มนี้');
                } else {
                    alert('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
                }
                returnEntry.value = null;
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
            clearEntry();
        };

        // Add user or book ID to the table
        const addToTable = async (type) => {
            if (type === 'm_user' && newEntry.value.m_user.trim() === '') return;
            if (type === 'b_id' && newEntry.value.b_id.trim() === '') return;

            if (type === 'b_id') {
                try {
                    const response = await axios.post(`/api/books/${newEntry.value.b_id}`);
                    bookName.value = response.data.b_name || 'ไม่พบข้อมูลหนังสือ';
                } catch (error) {
                    console.error('Error fetching book:', error);
                    bookName.value = 'ไม่สามารถโหลดข้อมูลหนังสือได้';
                }
            }
        };

        const addEntryToTable = async () => {
            if (!newEntry.value.b_id || !newEntry.value.m_user) {
                alert("กรุณากรอกข้อมูลให้ครบถ้วน");
                return;
            }

            try {
                const response = await axios.get(`/api/books/${newEntry.value.b_id}`);
                const bookName = response.data.b_name || 'ไม่พบข้อมูลหนังสือ';

                tempEntries.value.push({
                    b_id: newEntry.value.b_id.trim(),
                    b_name: bookName,
                    m_user: newEntry.value.m_user.trim(),
                    borrow_date: newEntry.value.borrow_date
                });

                clearEntry();
            } catch (error) {
                console.error('Error fetching book:', error);
                alert('ไม่สามารถโหลดข้อมูลหนังสือได้');
            }
        };

        const getUserIdByName = async (name) => {
            try {
                const response = await axios.get(`/api/members/${name}`);
                return response.data.m_user;
            } catch (error) {
                console.error("Error fetching user ID:", error);
                alert('ไม่พบข้อมูลผู้ใช้');
            }
        };

        // Save Borrow/Return data
        const saveBorrowReturn = async () => {
            if (tempEntries.value.length === 0) {
                alert("ไม่มีข้อมูลที่ต้องบันทึก");
                return;
            }

            try {
                for (const entry of tempEntries.value) {
                    // Fetch m_user (user ID) based on entered name
                    const m_user = await getUserIdByName(entry.m_user);
                    if (!m_user) {
                        alert("ไม่พบข้อมูลผู้ใช้งาน");
                        return;
                    }

                    const payload = {
                        b_id: entry.b_id?.trim(),
                        m_user: m_user, // Use m_user (user ID)
                        borrow_date: entry.borrow_date || new Date().toISOString().substr(0, 10)
                    };

                    console.log('Sending payload:', JSON.stringify(payload, null, 2));

                    if (!payload.b_id || !payload.m_user) {
                        console.error('🚨 Missing required fields! Payload:', payload);
                        alert('Missing required fields! Please check book ID and borrow date.');
                        return;
                    }

                    const apiUrl = isBorrowMode.value ? '/api/borrow-return' : `/api/borrow-return/${entry.b_id}`;

                    try {
                        const response = await axios.post(apiUrl, payload);
                        console.log("Server Response:", response.data);
                    } catch (entryError) {
                        console.error("Failed to save entry:", entry.b_id, entryError.response?.data || entryError.message);
                    }
                }

                alert('บันทึกข้อมูลสำเร็จ');
                isModalOpen.value = false;
                tempEntries.value = []; // Clear table after saving
                fetchAllBooks();
            } catch (error) {
                console.error('Error saving borrow:', error);
                alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
                if (error.response) {
                    console.error('Server error details:', error.response.data);
                    console.error('Status code:', error.response.status);
                    alert(`ไม่สามารถบันทึกข้อมูลได้: ${error.response.data.message || error.response.data || 'Server error'}`);
                } else {
                    alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
                }
            }
        };

        // Process book return
        const returnBook = async () => {
            if (!returnEntry.value) {
                alert('กรุณาเลือกหนังสือที่จะคืน');
                return;
            }

            try {
                await axios.delete(`/api/borrow-return/${returnBookId.value}`, {
                    data: { fine: returnEntry.value.fine }
                });

                alert('คืนหนังสือสำเร็จ');
                returnEntry.value = null;
                returnBookId.value = '';
                isModalOpen.value = false;
                fetchAllBooks();
            } catch (error) {
                console.error('Error returning book:', error);
                alert('ไม่สามารถคืนหนังสือได้ กรุณาลองใหม่อีกครั้ง');
            }
        };

        const members = ref([]);

        const fetchMembers = async () => {
            try {
                const response = await axios.get('/api/members');
                members.value = response.data;
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };

        onMounted(() => {
            fetchAllBooks();
            fetchMembers();
        });


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
            books,
            searchQuery,
            fetchAllBooks,
            fetchReturnDetails,
            returnBook,
            returnBookId,
            returnEntry,
            clearEntry,
            searchBooks,
            showBorrowModal,
            statistics,
            formatDate,
            addEntryToTable,
            saveBorrowReturn,
            toggleMode,
            addToTable,
        };
    }
});

// Mount the app
document.addEventListener('DOMContentLoaded', () => {
    app.mount('#app');
});