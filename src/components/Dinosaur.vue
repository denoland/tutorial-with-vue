<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: { dinosaur: String },
    data(): ComponentData {
        return {
            dinosaurDetails: null,
            isFavorite: false,
            isLoading: false
        };
    },
    async mounted() {
        const res = await fetch(`/api/dinosaurs/${this.dinosaur}`);
        this.dinosaurDetails = await res.json();
        
        await this.checkFavoriteStatus();
    },
    watch: {
        dinosaur: {
            immediate: false,
            async handler(newDino) {
                if (newDino) {
                    const res = await fetch(`/api/dinosaurs/${newDino}`);
                    this.dinosaurDetails = await res.json();
                    await this.checkFavoriteStatus();
                }
            }
        }
    },
    methods: {
        async checkFavoriteStatus() {
            if (!this.dinosaur) return;
            try {
                const res = await fetch(`/api/favorites/${this.dinosaur}`);
                const data = await res.json();
                this.isFavorite = data.isFavorite;
            } catch (error) {
                console.error('Failed to check favorite status:', error);
            }
        },
        async toggleFavorite() {
            if (!this.dinosaurDetails || this.isLoading) return;
            
            this.isLoading = true;
            try {
                const dinosaurName = this.dinosaurDetails.name;
                const method = this.isFavorite ? 'DELETE' : 'POST';
                
                const res = await fetch(`/api/favorites/${encodeURIComponent(dinosaurName)}`, {
                    method: method
                });
                
                const data = await res.json();
                this.isFavorite = data.isFavorite;
            } catch (error) {
                console.error('Failed to toggle favorite:', error);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
</script>

<template>
    <h1>{{ dinosaurDetails?.name }}</h1>
    <p>{{ dinosaurDetails?.description }}</p>
    
    <div style="margin: 20px 0;">
        <button 
            @click="toggleFavorite" 
            :disabled="isLoading"
            :style="{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                backgroundColor: isFavorite ? '#ff4757' : '#fff',
                color: isFavorite ? '#fff' : '#ff4757',
                border: '2px solid #ff4757',
                borderRadius: '5px',
                fontWeight: 'bold'
            }"
        >
            {{ isLoading ? 'Processing...' : (isFavorite ? '❤️ 已收藏' : '🤍 添加收藏') }}
        </button>
    </div>
    
    <RouterLink to="/" class="btn btn-secondary">Back to all dinosaurs</RouterLink>
</template>
