<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeRouteUpdate, onBeforeRouteEnter } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    setup() {
        const route = useRoute();
        const allDinosaurs = ref<Dinosaur[]>([]);
        const favoriteDinosaurs = ref<Dinosaur[]>([]);
        const showFavoritesOnly = ref(false);
        const isLoading = ref(true);
        const isRefreshing = ref(false);

        const displayedDinosaurs = computed(() => {
            return showFavoritesOnly.value ? favoriteDinosaurs.value : allDinosaurs.value;
        });

        const favoriteCount = computed(() => favoriteDinosaurs.value.length);

        async function loadData(showLoadingState: boolean = true) {
            if (showLoadingState) {
                isLoading.value = true;
            }
            isRefreshing.value = true;
            
            try {
                const [allRes, favRes] = await Promise.all([
                    fetch("/api/dinosaurs"),
                    fetch("/api/favorites")
                ]);
                
                allDinosaurs.value = await allRes.json() as Dinosaur[];
                favoriteDinosaurs.value = await favRes.json() as Dinosaur[];
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                isLoading.value = false;
                isRefreshing.value = false;
            }
        }

        function toggleFavoritesOnly() {
            showFavoritesOnly.value = !showFavoritesOnly.value;
        }

        function isFavorite(dinosaur: Dinosaur): boolean {
            return favoriteDinosaurs.value.some(fav => 
                fav.name.toLowerCase() === dinosaur.name.toLowerCase()
            );
        }

        onMounted(() => {
            loadData();
        });

        onBeforeRouteEnter((to, from, next) => {
            loadData(false);
            next();
        });

        onBeforeRouteUpdate((to, from, next) => {
            loadData(false);
            next();
        });

        return {
            allDinosaurs,
            favoriteDinosaurs,
            showFavoritesOnly,
            displayedDinosaurs,
            favoriteCount,
            isLoading,
            isRefreshing,
            toggleFavoritesOnly,
            isFavorite,
            loadData
        };
    }
});
</script>

<template>
    <div v-if="isLoading && !isRefreshing">
        <p>Loading dinosaurs...</p>
    </div>
    
    <div v-else>
        <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button 
                @click="toggleFavoritesOnly"
                :style="{
                    padding: '10px 20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: showFavoritesOnly ? '#ff4757' : '#f1f1f1',
                    color: showFavoritesOnly ? '#fff' : '#333',
                    border: '2px solid #ff4757',
                    borderRadius: '5px',
                    fontWeight: 'bold'
                }"
            >
                {{ showFavoritesOnly ? '❤️ 显示全部' : '🤍 只看收藏' }}
                <span v-if="favoriteCount > 0" style="margin-left: 8px;">
                    ({{ favoriteCount }})
                </span>
            </button>
            
            <button 
                @click="loadData(false)"
                :disabled="isRefreshing"
                :style="{
                    padding: '10px 15px',
                    fontSize: '14px',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    border: '2px solid #4CAF50',
                    borderRadius: '5px',
                    fontWeight: 'bold'
                }"
            >
                {{ isRefreshing ? '🔄 刷新中...' : '🔄 刷新' }}
            </button>
        </div>
        
        <div v-if="showFavoritesOnly && favoriteCount === 0" 
             style="margin-bottom: 20px; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="color: #666; font-style: italic; margin: 0;">
                还没有收藏任何恐龙。点击恐龙名称进入详情页添加收藏吧！
            </p>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <RouterLink 
                v-for="dinosaur in displayedDinosaurs" 
                :key="dinosaur.name"
                :to="{ name: 'Dinosaur', params: { dinosaur: `${dinosaur.name.toLowerCase()}` } }"
                class="btn btn-primary"
                :style="{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                }"
            >
                <span v-if="isFavorite(dinosaur)">❤️</span>
                {{ dinosaur.name }}
            </RouterLink>
        </div>
    </div>
</template>
