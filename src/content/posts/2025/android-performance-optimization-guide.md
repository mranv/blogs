---
title: "Android Performance Optimization: Complete Guide for Modern Architecture"
slug: "android-performance-optimization-guide"
pubDatetime: 2025-07-02T11:45:00+05:30
tags: ["Android", "Performance", "Optimization", "MVVM", "Jetpack Compose", "Memory Management"]
categories: ["Mobile Development", "Performance", "Optimization"]
excerpt: "Comprehensive guide to optimizing Android application performance with modern MVVM architecture, Jetpack Compose, and advanced profiling techniques."
draft: false
---

# Android Performance Optimization: Complete Guide for Modern Architecture

Performance optimization is crucial for creating exceptional Android user experiences. This comprehensive guide explores advanced performance optimization techniques for modern Android applications using MVVM architecture, Jetpack Compose, and contemporary development practices.

## Performance Monitoring Foundation

### Performance Metrics Collection

```kotlin
// Custom performance monitoring system
@Singleton
class PerformanceMonitor @Inject constructor(
    private val analytics: Analytics,
    private val preferences: SharedPreferences
) {
    private val performanceMetrics = mutableMapOf<String, PerformanceMetric>()
    
    fun startMeasurement(operation: String): PerformanceToken {
        val startTime = System.nanoTime()
        val memoryBefore = getMemoryUsage()
        
        return PerformanceToken(
            operation = operation,
            startTime = startTime,
            memoryBefore = memoryBefore
        )
    }
    
    fun endMeasurement(token: PerformanceToken) {
        val endTime = System.nanoTime()
        val memoryAfter = getMemoryUsage()
        val duration = (endTime - token.startTime) / 1_000_000 // Convert to ms
        
        val metric = PerformanceMetric(
            operation = token.operation,
            durationMs = duration,
            memoryUsedMB = (memoryAfter - token.memoryBefore) / (1024 * 1024),
            timestamp = System.currentTimeMillis()
        )
        
        recordMetric(metric)
    }
    
    private fun recordMetric(metric: PerformanceMetric) {
        performanceMetrics[metric.operation] = metric
        
        // Log performance issues
        when {
            metric.durationMs > 1000 -> {
                Timber.w("Slow operation detected: ${metric.operation} took ${metric.durationMs}ms")
                analytics.track("performance_slow_operation", mapOf(
                    "operation" to metric.operation,
                    "duration_ms" to metric.durationMs
                ))
            }
            metric.memoryUsedMB > 50 -> {
                Timber.w("High memory usage: ${metric.operation} used ${metric.memoryUsedMB}MB")
                analytics.track("performance_high_memory", mapOf(
                    "operation" to metric.operation,
                    "memory_mb" to metric.memoryUsedMB
                ))
            }
        }
    }
    
    private fun getMemoryUsage(): Long {
        val runtime = Runtime.getRuntime()
        return runtime.totalMemory() - runtime.freeMemory()
    }
}

data class PerformanceToken(
    val operation: String,
    val startTime: Long,
    val memoryBefore: Long
)

data class PerformanceMetric(
    val operation: String,
    val durationMs: Long,
    val memoryUsedMB: Long,
    val timestamp: Long
)
```

## ViewModel Performance Optimization

### Efficient State Management

```kotlin
// Optimized ViewModel with performance considerations
@HiltViewModel
class OptimizedTasksViewModel @Inject constructor(
    private val repository: TasksRepository,
    private val performanceMonitor: PerformanceMonitor,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ViewModel() {
    
    // Use StateFlow for better performance than LiveData
    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()
    
    // Cached computed properties to avoid recalculation
    private val _filteredTasks = MutableStateFlow<List<Task>>(emptyList())
    val filteredTasks: StateFlow<List<Task>> = _filteredTasks.asStateFlow()
    
    // Debounced search to prevent excessive API calls
    private val searchQuery = MutableStateFlow("")
    
    init {
        setupTasksObservation()
        setupSearchDebouncing()
    }
    
    private fun setupTasksObservation() {
        viewModelScope.launch {
            combine(
                repository.tasks,
                _uiState.map { it.currentFilter },
                searchQuery.debounce(300) // Debounce search queries
            ) { tasks, filter, query ->
                val token = performanceMonitor.startMeasurement("filter_tasks")
                
                val filtered = tasks
                    .asSequence() // Use sequence for lazy evaluation
                    .filter { task ->
                        when (filter) {
                            TasksFilterType.ACTIVE_TASKS -> !task.isCompleted
                            TasksFilterType.COMPLETED_TASKS -> task.isCompleted
                            TasksFilterType.ALL_TASKS -> true
                        }
                    }
                    .filter { task ->
                        if (query.isBlank()) true
                        else task.title.contains(query, ignoreCase = true) ||
                             task.description.contains(query, ignoreCase = true)
                    }
                    .toList()
                
                performanceMonitor.endMeasurement(token)
                filtered
            }.collect { tasks ->
                _filteredTasks.value = tasks
                _uiState.value = _uiState.value.copy(
                    tasks = tasks,
                    isLoading = false,
                    isEmpty = tasks.isEmpty()
                )
            }
        }
    }
    
    private fun setupSearchDebouncing() {
        viewModelScope.launch {
            searchQuery
                .debounce(300) // Wait 300ms after user stops typing
                .distinctUntilChanged() // Only emit when query actually changes
                .collect { query ->
                    // Search logic is handled in setupTasksObservation()
                    Timber.d("Search query: $query")
                }
        }
    }
    
    fun setFilter(filter: TasksFilterType) {
        _uiState.value = _uiState.value.copy(currentFilter = filter)
    }
    
    fun searchTasks(query: String) {
        searchQuery.value = query
    }
    
    // Optimized task completion with batching
    private val pendingTaskUpdates = mutableSetOf<String>()
    private var updateJob: Job? = null
    
    fun completeTask(taskId: String, completed: Boolean = true) {
        // Add to pending updates
        pendingTaskUpdates.add(taskId)
        
        // Cancel previous update job and start a new one
        updateJob?.cancel()
        updateJob = viewModelScope.launch {
            delay(100) // Wait for potential batch updates
            
            val tasksToUpdate = pendingTaskUpdates.toSet()
            pendingTaskUpdates.clear()
            
            withContext(ioDispatcher) {
                val token = performanceMonitor.startMeasurement("batch_update_tasks")
                
                try {
                    // Batch update tasks
                    repository.updateTasksCompletion(tasksToUpdate, completed)
                } catch (e: Exception) {
                    Timber.e(e, "Failed to update tasks")
                    _uiState.value = _uiState.value.copy(
                        errorMessage = "Failed to update tasks"
                    )
                } finally {
                    performanceMonitor.endMeasurement(token)
                }
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        updateJob?.cancel()
    }
}
```

### Memory-Efficient Repository

```kotlin
// Repository with caching and memory management
@Singleton
class OptimizedTasksRepository @Inject constructor(
    private val localDataSource: TasksLocalDataSource,
    private val remoteDataSource: TasksRemoteDataSource,
    private val performanceMonitor: PerformanceMonitor,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) {
    
    // LRU Cache for frequently accessed tasks
    private val taskCache = LruCache<String, Task>(maxSize = 100)
    
    // In-memory cache with TTL
    private val tasksCache = CacheEntry<List<Task>>()
    private val cacheValidityMs = TimeUnit.MINUTES.toMillis(5)
    
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()
    
    suspend fun loadTasks(forceRefresh: Boolean = false): Result<List<Task>> {
        return withContext(dispatcher) {
            val token = performanceMonitor.startMeasurement("load_tasks")
            
            try {
                // Check cache first
                if (!forceRefresh && tasksCache.isValid(cacheValidityMs)) {
                    tasksCache.data?.let { cachedTasks ->
                        _tasks.value = cachedTasks
                        return@withContext Result.success(cachedTasks)
                    }
                }
                
                // Load from local database first (faster)
                val localTasks = localDataSource.getTasks()
                _tasks.value = localTasks
                tasksCache.updateData(localTasks)
                
                // Sync with remote in background if needed
                if (shouldSyncWithRemote()) {
                    launch {
                        syncWithRemote()
                    }
                }
                
                Result.success(localTasks)
            } catch (e: Exception) {
                Timber.e(e, "Failed to load tasks")
                Result.failure(e)
            } finally {
                performanceMonitor.endMeasurement(token)
            }
        }
    }
    
    suspend fun getTask(taskId: String): Task? {
        return withContext(dispatcher) {
            // Check memory cache first
            taskCache[taskId]?.let { return@withContext it }
            
            // Check local database
            val task = localDataSource.getTask(taskId)
            task?.let { taskCache.put(taskId, it) }
            
            task
        }
    }
    
    suspend fun updateTasksCompletion(taskIds: Set<String>, completed: Boolean) {
        withContext(dispatcher) {
            val token = performanceMonitor.startMeasurement("batch_update_tasks")
            
            try {
                // Batch database update
                localDataSource.updateTasksCompletion(taskIds, completed)
                
                // Update memory cache
                taskIds.forEach { taskId ->
                    taskCache[taskId]?.let { task ->
                        taskCache.put(taskId, task.copy(isCompleted = completed))
                    }
                }
                
                // Refresh tasks list
                loadTasks()
                
                // Queue remote sync
                queueRemoteSync(taskIds.map { UpdateOperation(it, completed) })
                
            } finally {
                performanceMonitor.endMeasurement(token)
            }
        }
    }
    
    private suspend fun syncWithRemote() {
        try {
            val remoteTasks = remoteDataSource.getTasks()
            localDataSource.saveTasks(remoteTasks)
            
            // Update in-memory state
            _tasks.value = remoteTasks
            tasksCache.updateData(remoteTasks)
            
            // Clear individual task cache to avoid inconsistencies
            taskCache.evictAll()
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to sync with remote")
        }
    }
    
    private fun shouldSyncWithRemote(): Boolean {
        // Implement smart sync logic based on network conditions, battery, etc.
        return true
    }
    
    private fun queueRemoteSync(operations: List<UpdateOperation>) {
        // Queue operations for background sync when network is available
        // Implementation depends on your sync strategy (WorkManager, etc.)
    }
}

// Cache helper class
private class CacheEntry<T> {
    var data: T? = null
        private set
    private var timestamp: Long = 0
    
    fun updateData(newData: T) {
        data = newData
        timestamp = System.currentTimeMillis()
    }
    
    fun isValid(validityMs: Long): Boolean {
        return data != null && (System.currentTimeMillis() - timestamp) < validityMs
    }
}
```

## Jetpack Compose Performance Optimization

### Recomposition Optimization

```kotlin
// Stable data classes to prevent unnecessary recompositions
@Immutable
data class TasksUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val currentFilter: TasksFilterType = TasksFilterType.ALL_TASKS,
    val searchQuery: String = ""
)

// Optimized Compose components
@Composable
fun OptimizedTasksList(
    tasks: List<Task>,
    onTaskClick: (String) -> Unit,
    onTaskLongClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Use key parameter to help Compose identify items efficiently
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(
            items = tasks,
            key = { task -> task.id } // Crucial for performance
        ) { task ->
            // Wrap in derivedStateOf for computed properties
            val isHighPriority by remember(task.priority) {
                derivedStateOf { task.priority == TaskPriority.HIGH }
            }
            
            OptimizedTaskItem(
                task = task,
                isHighPriority = isHighPriority,
                onTaskClick = onTaskClick,
                onTaskLongClick = onTaskLongClick
            )
        }
    }
}

@Composable
fun OptimizedTaskItem(
    task: Task,
    isHighPriority: Boolean,
    onTaskClick: (String) -> Unit,
    onTaskLongClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Memoize expensive calculations
    val titleStyle by remember(task.isCompleted) {
        derivedStateOf {
            if (task.isCompleted) {
                MaterialTheme.typography.bodyLarge.copy(
                    textDecoration = TextDecoration.LineThrough,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            } else {
                MaterialTheme.typography.bodyLarge
            }
        }
    }
    
    // Use stable callbacks to prevent recomposition
    val onClickCallback = remember { { onTaskClick(task.id) } }
    val onLongClickCallback = remember { { onTaskLongClick(task.id) } }
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = onClickCallback,
                onLongClick = onLongClickCallback
            ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isHighPriority) 4.dp else 2.dp
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = task.title,
                style = titleStyle,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            if (task.description.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = task.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            // Conditional rendering for performance
            if (isHighPriority) {
                Spacer(modifier = Modifier.height(8.dp))
                PriorityIndicator(priority = task.priority)
            }
        }
    }
}

// Separate component for complex UI elements
@Composable
private fun PriorityIndicator(
    priority: TaskPriority,
    modifier: Modifier = Modifier
) {
    val (color, text) = remember(priority) {
        when (priority) {
            TaskPriority.HIGH -> MaterialTheme.colorScheme.error to "High Priority"
            TaskPriority.MEDIUM -> MaterialTheme.colorScheme.primary to "Medium Priority"
            TaskPriority.LOW -> MaterialTheme.colorScheme.secondary to "Low Priority"
        }
    }
    
    Surface(
        modifier = modifier,
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
```

### Custom Modifiers for Performance

```kotlin
// Reusable performance-optimized modifiers
object PerformanceModifiers {
    
    fun Modifier.optimizedClickable(
        onClick: () -> Unit,
        onLongClick: (() -> Unit)? = null
    ): Modifier = composed {
        val interactionSource = remember { MutableInteractionSource() }
        
        this.combinedClickable(
            interactionSource = interactionSource,
            indication = rememberRipple(),
            onClick = onClick,
            onLongClick = onLongClick
        )
    }
    
    fun Modifier.conditionalModifier(
        condition: Boolean,
        modifier: Modifier
    ): Modifier = if (condition) this.then(modifier) else this
    
    fun Modifier.animateContentSizeOptimized(
        animationSpec: FiniteAnimationSpec<IntSize> = tween(300)
    ): Modifier = composed {
        var sizeAnimation by remember { mutableStateOf<Animatable<IntSize, AnimationVector2D>?>(null) }
        
        this.layout { measurable, constraints ->
            val placeable = measurable.measure(constraints)
            val currentSize = IntSize(placeable.width, placeable.height)
            
            val animation = sizeAnimation ?: Animatable(currentSize, IntSize.VectorConverter).also {
                sizeAnimation = it
            }
            
            if (animation.targetValue != currentSize) {
                animation.animateTo(currentSize, animationSpec)
            }
            
            layout(animation.value.width, animation.value.height) {
                placeable.placeRelative(0, 0)
            }
        }
    }
}

// Usage example
@Composable
fun PerformantTaskCard(
    task: Task,
    isExpanded: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .optimizedClickable(onClick = onClick)
            .conditionalModifier(
                condition = isExpanded,
                modifier = Modifier.animateContentSizeOptimized()
            )
    ) {
        // Card content
    }
}
```

## Database Performance Optimization

### Optimized Room Queries

```kotlin
@Dao
interface OptimizedTasksDao {
    
    // Use specific columns instead of SELECT *
    @Query("""
        SELECT id, title, is_completed, priority, created_at 
        FROM tasks 
        WHERE is_completed = :isCompleted 
        ORDER BY 
            CASE priority 
                WHEN 'HIGH' THEN 0 
                WHEN 'MEDIUM' THEN 1 
                WHEN 'LOW' THEN 2 
            END,
            created_at DESC
    """)
    fun getTasksByCompletion(isCompleted: Boolean): Flow<List<TaskSummary>>
    
    // Paginated queries for large datasets
    @Query("""
        SELECT * FROM tasks 
        WHERE title LIKE :searchQuery OR description LIKE :searchQuery
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset
    """)
    suspend fun searchTasks(searchQuery: String, limit: Int, offset: Int): List<Task>
    
    // Batch operations for better performance
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<Task>)
    
    @Update
    suspend fun updateTasks(tasks: List<Task>)
    
    // Efficient count queries
    @Query("SELECT COUNT(*) FROM tasks WHERE is_completed = :isCompleted")
    suspend fun getTaskCount(isCompleted: Boolean): Int
    
    // Use indexes for better query performance
    @Query("""
        CREATE INDEX IF NOT EXISTS index_tasks_completion_priority 
        ON tasks(is_completed, priority, created_at)
    """)
    suspend fun createPerformanceIndexes()
    
    // Efficient bulk updates
    @Query("UPDATE tasks SET is_completed = :isCompleted WHERE id IN (:taskIds)")
    suspend fun updateTasksCompletion(taskIds: List<String>, isCompleted: Boolean)
    
    // Clean up old data periodically
    @Query("DELETE FROM tasks WHERE created_at < :cutoffTime AND is_completed = 1")
    suspend fun deleteOldCompletedTasks(cutoffTime: Long)
}

// Data classes optimized for queries
@Entity(
    tableName = "tasks",
    indices = [
        Index(value = ["is_completed", "priority", "created_at"]),
        Index(value = ["title"]), // For search queries
        Index(value = ["created_at"]) // For date range queries
    ]
)
data class Task(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    @ColumnInfo(name = "is_completed") val isCompleted: Boolean,
    val priority: TaskPriority,
    @ColumnInfo(name = "created_at") val createdAt: Long,
    @ColumnInfo(name = "updated_at") val updatedAt: Long
)

// Lightweight data class for list queries
data class TaskSummary(
    val id: String,
    val title: String,
    @ColumnInfo(name = "is_completed") val isCompleted: Boolean,
    val priority: TaskPriority,
    @ColumnInfo(name = "created_at") val createdAt: Long
)
```

### Database Migration Performance

```kotlin
// Optimized database migrations
@Database(
    entities = [Task::class],
    version = 3,
    exportSchema = true
)
abstract class OptimizedTodoDatabase : RoomDatabase() {
    
    abstract fun taskDao(): OptimizedTasksDao
    
    companion object {
        // Efficient migration that preserves performance
        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Create new table with better structure
                database.execSQL("""
                    CREATE TABLE tasks_new (
                        id TEXT PRIMARY KEY NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL DEFAULT '',
                        is_completed INTEGER NOT NULL DEFAULT 0,
                        priority TEXT NOT NULL DEFAULT 'MEDIUM',
                        created_at INTEGER NOT NULL DEFAULT 0,
                        updated_at INTEGER NOT NULL DEFAULT 0
                    )
                """)
                
                // Copy data efficiently
                database.execSQL("""
                    INSERT INTO tasks_new (id, title, description, is_completed, created_at, updated_at)
                    SELECT id, title, description, is_completed, 
                           COALESCE(created_at, ${System.currentTimeMillis()}),
                           ${System.currentTimeMillis()}
                    FROM tasks
                """)
                
                // Drop old table and rename new one
                database.execSQL("DROP TABLE tasks")
                database.execSQL("ALTER TABLE tasks_new RENAME TO tasks")
                
                // Create indexes for optimal performance
                database.execSQL("""
                    CREATE INDEX index_tasks_completion_priority 
                    ON tasks(is_completed, priority, created_at)
                """)
                database.execSQL("CREATE INDEX index_tasks_title ON tasks(title)")
                database.execSQL("CREATE INDEX index_tasks_created_at ON tasks(created_at)")
            }
        }
    }
}
```

## Network Performance Optimization

### Optimized API Client

```kotlin
// High-performance HTTP client configuration
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(
        @ApplicationContext context: Context
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .connectionPool(ConnectionPool(5, 5, TimeUnit.MINUTES))
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            })
            .addInterceptor(CacheInterceptor())
            .cache(Cache(File(context.cacheDir, "http-cache"), 50L * 1024L * 1024L)) // 50MB cache
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
    }
}

// Smart caching interceptor
class CacheInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)
        
        // Apply different caching strategies based on endpoint
        val cacheControl = when {
            request.url.pathSegments.contains("tasks") -> {
                CacheControl.Builder()
                    .maxAge(5, TimeUnit.MINUTES) // Cache tasks for 5 minutes
                    .build()
            }
            request.url.pathSegments.contains("user") -> {
                CacheControl.Builder()
                    .maxAge(1, TimeUnit.HOURS) // Cache user info for 1 hour
                    .build()
            }
            else -> {
                CacheControl.Builder()
                    .maxAge(1, TimeUnit.MINUTES)
                    .build()
            }
        }
        
        return response.newBuilder()
            .header("Cache-Control", cacheControl.toString())
            .build()
    }
}
```

### Efficient Data Synchronization

```kotlin
// Optimized sync service
@HiltWorker
class OptimizedSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: TasksRepository,
    private val performanceMonitor: PerformanceMonitor
) : CoroutineWorker(appContext, workerParams) {
    
    override suspend fun doWork(): Result {
        val token = performanceMonitor.startMeasurement("background_sync")
        
        return try {
            withContext(Dispatchers.IO) {
                val lastSyncTime = getLastSyncTime()
                
                // Only sync changes since last sync
                val deltaChanges = repository.getChangesSince(lastSyncTime)
                
                if (deltaChanges.isNotEmpty()) {
                    // Batch API calls for efficiency
                    val results = deltaChanges.chunked(50).map { batch ->
                        async { repository.syncBatch(batch) }
                    }.awaitAll()
                    
                    if (results.all { it.isSuccess }) {
                        updateLastSyncTime()
                        Result.success()
                    } else {
                        Result.retry()
                    }
                } else {
                    Result.success() // No changes to sync
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Sync failed")
            Result.failure()
        } finally {
            performanceMonitor.endMeasurement(token)
        }
    }
    
    private suspend fun getLastSyncTime(): Long {
        // Get from preferences or database
        return 0L
    }
    
    private suspend fun updateLastSyncTime() {
        // Update sync timestamp
    }
}
```

## Memory Management

### Memory-Efficient Image Loading

```kotlin
// Optimized image loading with Coil
@Composable
fun OptimizedTaskImage(
    imageUrl: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier
) {
    if (imageUrl != null) {
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(imageUrl)
                .crossfade(true)
                .memoryCachePolicy(CachePolicy.ENABLED)
                .diskCachePolicy(CachePolicy.ENABLED)
                .size(Size.ORIGINAL) // Let Coil handle sizing
                .build(),
            contentDescription = contentDescription,
            modifier = modifier,
            contentScale = ContentScale.Crop,
            error = painterResource(R.drawable.ic_error_placeholder),
            placeholder = painterResource(R.drawable.ic_loading_placeholder)
        )
    } else {
        // Placeholder for missing images
        Box(
            modifier = modifier.background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Image,
                contentDescription = contentDescription,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// Image cache configuration
@Module
@InstallIn(SingletonComponent::class)
object ImageModule {
    
    @Provides
    @Singleton
    fun provideImageLoader(
        @ApplicationContext context: Context,
        okHttpClient: OkHttpClient
    ): ImageLoader {
        return ImageLoader.Builder(context)
            .okHttpClient(okHttpClient)
            .memoryCache {
                MemoryCache.Builder(context)
                    .maxSizePercent(0.25) // Use 25% of available memory
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(context.cacheDir.resolve("image_cache"))
                    .maxSizeBytes(100 * 1024 * 1024) // 100MB
                    .build()
            }
            .respectCacheHeaders(false) // Handle caching manually
            .build()
    }
}
```

### Memory Leak Prevention

```kotlin
// Memory-safe ViewModel base class
abstract class LeakSafeViewModel : ViewModel() {
    
    // Use weak references for context-dependent operations
    private val contextRefs = mutableSetOf<WeakReference<Context>>()
    
    protected fun addContextReference(context: Context) {
        contextRefs.add(WeakReference(context))
    }
    
    protected fun getValidContext(): Context? {
        return contextRefs.firstOrNull { it.get() != null }?.get()
    }
    
    override fun onCleared() {
        super.onCleared()
        contextRefs.clear()
    }
    
    // Safe coroutine launching
    protected fun launchSafely(
        block: suspend CoroutineScope.() -> Unit
    ): Job {
        return viewModelScope.launch {
            try {
                block()
            } catch (e: CancellationException) {
                throw e // Re-throw cancellation
            } catch (e: Exception) {
                Timber.e(e, "Coroutine failed in ${this@LeakSafeViewModel::class.simpleName}")
            }
        }
    }
}

// Memory monitoring utility
class MemoryMonitor @Inject constructor() {
    
    fun getCurrentMemoryUsage(): MemoryInfo {
        val runtime = Runtime.getRuntime()
        val activityManager = getSystemService<ActivityManager>()
        
        return MemoryInfo(
            heapUsedMB = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024),
            heapMaxMB = runtime.maxMemory() / (1024 * 1024),
            isLowMemory = activityManager?.isLowMemory ?: false
        )
    }
    
    fun logMemoryWarnings() {
        val memInfo = getCurrentMemoryUsage()
        
        if (memInfo.heapUsedMB > memInfo.heapMaxMB * 0.8) {
            Timber.w("High memory usage: ${memInfo.heapUsedMB}MB / ${memInfo.heapMaxMB}MB")
        }
        
        if (memInfo.isLowMemory) {
            Timber.w("System is in low memory state")
        }
    }
}

data class MemoryInfo(
    val heapUsedMB: Long,
    val heapMaxMB: Long,
    val isLowMemory: Boolean
)
```

## Performance Testing and Monitoring

### Automated Performance Testing

```kotlin
// Performance benchmark tests
@RunWith(AndroidJUnit4::class)
class TasksPerformanceBenchmark {
    
    @get:Rule
    val benchmarkRule = BenchmarkRule()
    
    @Test
    fun benchmarkTaskListScrolling() {
        benchmarkRule.measureRepeated {
            composeTestRule.setContent {
                val tasks = remember { generateTestTasks(1000) }
                TasksList(tasks = tasks, onTaskClick = {})
            }
            
            // Measure scrolling performance
            composeTestRule.onRoot()
                .performGesture { swipeUp() }
        }
    }
    
    @Test
    fun benchmarkDatabaseOperations() = runTest {
        benchmarkRule.measureRepeated {
            val tasks = generateTestTasks(100)
            
            runBlocking {
                tasks.forEach { task ->
                    repository.saveTask(task)
                }
                
                repository.getTasks()
            }
        }
    }
    
    private fun generateTestTasks(count: Int): List<Task> {
        return (1..count).map { index ->
            Task(
                id = "task_$index",
                title = "Task $index",
                description = "Description for task $index",
                isCompleted = index % 3 == 0,
                priority = TaskPriority.values()[index % 3],
                createdAt = System.currentTimeMillis() - (index * 1000),
                updatedAt = System.currentTimeMillis()
            )
        }
    }
}

// Custom performance assertions
object PerformanceAssertions {
    
    fun assertExecutionTime(maxTimeMs: Long, operation: () -> Unit) {
        val startTime = System.nanoTime()
        operation()
        val endTime = System.nanoTime()
        
        val actualTimeMs = (endTime - startTime) / 1_000_000
        
        if (actualTimeMs > maxTimeMs) {
            throw AssertionError(
                "Operation took ${actualTimeMs}ms, expected maximum ${maxTimeMs}ms"
            )
        }
    }
    
    fun assertMemoryUsage(maxMemoryMB: Long, operation: () -> Unit) {
        System.gc() // Suggest garbage collection
        Thread.sleep(100) // Wait for GC
        
        val runtime = Runtime.getRuntime()
        val memoryBefore = runtime.totalMemory() - runtime.freeMemory()
        
        operation()
        
        System.gc()
        Thread.sleep(100)
        
        val memoryAfter = runtime.totalMemory() - runtime.freeMemory()
        val memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024)
        
        if (memoryUsedMB > maxMemoryMB) {
            throw AssertionError(
                "Operation used ${memoryUsedMB}MB, expected maximum ${maxMemoryMB}MB"
            )
        }
    }
}
```

## Conclusion

Android performance optimization requires a holistic approach covering all layers of your application:

- **Monitoring Foundation**: Implement comprehensive performance metrics collection
- **ViewModel Optimization**: Use StateFlow, debouncing, and efficient state management
- **Repository Performance**: Implement caching, batching, and smart sync strategies  
- **Compose Optimization**: Optimize recomposition with stable data and efficient modifiers
- **Database Performance**: Use optimized queries, indexing, and batch operations
- **Memory Management**: Prevent leaks and optimize image loading
- **Network Efficiency**: Implement smart caching and efficient synchronization
- **Performance Testing**: Create automated benchmarks and assertions

Key principles for high-performance Android apps:

1. **Measure First**: Always profile before optimizing
2. **Optimize Lazily**: Use lazy evaluation and on-demand loading
3. **Cache Wisely**: Implement multi-level caching strategies
4. **Batch Operations**: Group related operations for efficiency
5. **Monitor Continuously**: Track performance in production

By following these optimization strategies, you'll create Android applications that provide smooth, responsive user experiences while maintaining clean, maintainable code architecture.

Remember: premature optimization can be counterproductive. Always measure performance impact and optimize the most critical paths first.