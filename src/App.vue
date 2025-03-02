<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios';

const books = ref([]);

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:5000/books');
    books.value = response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
  } 
});
</script>

<template>
  <div>
    <h1>Library Books</h1>
    <ul>
      <li v-for="book in books" :key="book.book_id">{{ book.book_name }}</li>
    </ul>
  </div>
</template>