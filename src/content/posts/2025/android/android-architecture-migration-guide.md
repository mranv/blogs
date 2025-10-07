---
title: "Android Architecture Migration Guide: From Legacy to Modern MVVM"
slug: "android-architecture-migration-guide"
pubDatetime: 2025-08-15T09:00:00+05:30
tags: ["Android", "Migration", "MVVM", "Architecture", "Refactoring", "Legacy Code"]
categories: ["Mobile Development", "Architecture", "Migration"]
excerpt: "Complete guide to migrating legacy Android applications to modern MVVM architecture with Jetpack Compose, including step-by-step strategies and real-world examples."
draft: false
---

# Android Architecture Migration Guide: From Legacy to Modern MVVM

Migrating legacy Android applications to modern architecture patterns is a critical step in maintaining code quality and developer productivity. This comprehensive guide provides strategies for migrating from various legacy patterns to modern MVVM architecture with Jetpack Compose.

## Migration Strategy Overview

### Assessment and Planning Phase

```kotlin
// Migration Assessment Checklist
data class MigrationAssessment(
    val currentArchitecture: ArchitecturePattern,
    val codebaseSize: CodebaseMetrics,
    val technicalDebt: TechnicalDebtMetrics,
    val testCoverage: TestCoverageMetrics,
    val migrationComplexity: ComplexityLevel
) {
    fun generateMigrationPlan(): MigrationPlan {
        return MigrationPlan(
            phases = listOf(
                Phase.DEPENDENCY_INJECTION_SETUP,
                Phase.REPOSITORY_PATTERN_INTRODUCTION,
                Phase.VIEWMODEL_MIGRATION,
                Phase.UI_LAYER_MODERNIZATION,
                Phase.TESTING_IMPLEMENTATION
            ),
            estimatedDuration = calculateDuration(),
            riskFactors = identifyRisks()
        )
    }
}

enum class ArchitecturePattern {
    LEGACY_MVC,
    MVP,
    MVVM_LEGACY,
    NO_ARCHITECTURE
}
```

### Incremental Migration Approach

```kotlin
// Migration phases with feature flags
class MigrationManager(
    private val featureFlags: FeatureFlags,
    private val analytics: Analytics
) {
    fun shouldUseLegacyImplementation(feature: Feature): Boolean {
        return when (featureFlags.getMigrationPhase(feature)) {
            MigrationPhase.NOT_STARTED -> true
            MigrationPhase.IN_PROGRESS -> featureFlags.isEnabled("${feature.name}_new_impl")
            MigrationPhase.COMPLETED -> false
        }
    }
    
    fun trackMigrationProgress(feature: Feature, success: Boolean) {
        analytics.track("migration_progress", mapOf(
            "feature" to feature.name,
            "success" to success,
            "phase" to featureFlags.getMigrationPhase(feature)
        ))
    }
}
```

## Migrating from Legacy MVC/No Architecture

### Before: Legacy Activity-Heavy Architecture

```kotlin
// Legacy: Everything in Activity
class LegacyTasksActivity : AppCompatActivity() {
    
    private lateinit var tasksAdapter: TasksAdapter
    private lateinit var database: SQLiteDatabase
    private val tasks = mutableListOf<Task>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tasks)
        
        setupViews()
        setupDatabase()
        loadTasks()
    }
    
    private fun setupViews() {
        tasksAdapter = TasksAdapter(tasks) { task ->
            // Handle task click directly in activity
            if (task.isCompleted) {
                markTaskActive(task.id)
            } else {
                markTaskCompleted(task.id)
            }
        }
        
        findViewById<RecyclerView>(R.id.tasks_list).adapter = tasksAdapter
        
        findViewById<FloatingActionButton>(R.id.fab_add_task).setOnClickListener {
            // Direct navigation logic
            startActivity(Intent(this, AddTaskActivity::class.java))
        }
    }
    
    private fun loadTasks() {
        // Direct database access in UI thread (anti-pattern)
        Thread {
            val cursor = database.rawQuery("SELECT * FROM tasks", null)
            val loadedTasks = mutableListOf<Task>()
            
            while (cursor.moveToNext()) {
                loadedTasks.add(
                    Task(
                        id = cursor.getString(cursor.getColumnIndex("id")),
                        title = cursor.getString(cursor.getColumnIndex("title")),
                        isCompleted = cursor.getInt(cursor.getColumnIndex("is_completed")) == 1
                    )
                )
            }
            cursor.close()
            
            runOnUiThread {
                tasks.clear()
                tasks.addAll(loadedTasks)
                tasksAdapter.notifyDataSetChanged()
            }
        }.start()
    }
    
    private fun markTaskCompleted(taskId: String) {
        // Direct database update (anti-pattern)
        Thread {
            database.execSQL("UPDATE tasks SET is_completed = 1 WHERE id = ?", arrayOf(taskId))
            loadTasks() // Reload everything
        }.start()
    }
}
```

### After: Modern MVVM with Repository Pattern

```kotlin
// Step 1: Introduce Repository Layer
@Singleton
class TasksRepository @Inject constructor(
    private val localDataSource: TasksLocalDataSource,
    private val remoteDataSource: TasksRemoteDataSource,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) {
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()
    
    suspend fun loadTasks() = withContext(dispatcher) {
        try {
            val localTasks = localDataSource.getTasks()
            _tasks.value = localTasks
            
            // Sync with remote if needed
            val remoteTasks = remoteDataSource.getTasks()
            localDataSource.saveTasks(remoteTasks)
            _tasks.value = remoteTasks
        } catch (e: Exception) {
            Timber.e(e, "Failed to load tasks")
        }
    }
    
    suspend fun updateTask(task: Task) = withContext(dispatcher) {
        localDataSource.updateTask(task)
        remoteDataSource.updateTask(task)
        loadTasks() // Refresh local state
    }
}

// Step 2: Implement ViewModel
@HiltViewModel
class TasksViewModel @Inject constructor(
    private val repository: TasksRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()
    
    init {
        loadTasks()
        collectTasks()
    }
    
    private fun collectTasks() {
        viewModelScope.launch {
            repository.tasks.collect { tasks ->
                _uiState.value = _uiState.value.copy(
                    tasks = tasks,
                    isLoading = false
                )
            }
        }
    }
    
    fun completeTask(taskId: String) {
        viewModelScope.launch {
            val task = _uiState.value.tasks.find { it.id == taskId }
            task?.let {
                repository.updateTask(it.copy(isCompleted = !it.isCompleted))
            }
        }
    }
    
    private fun loadTasks() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            repository.loadTasks()
        }
    }
}

// Step 3: Modernized Activity/Fragment
@AndroidEntryPoint
class TasksActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            TodoTheme {
                TasksScreen()
            }
        }
    }
}

@Composable
fun TasksScreen(
    viewModel: TasksViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    TasksContent(
        uiState = uiState,
        onTaskClick = viewModel::completeTask,
        onAddTask = { /* Navigate to add task */ }
    )
}
```

## Migrating from MVP to MVVM

### Before: MVP Architecture

```kotlin
// MVP Presenter
class TasksPresenter(
    private val view: TasksContract.View,
    private val repository: TasksRepository
) : TasksContract.Presenter {
    
    private var tasks: List<Task> = emptyList()
    
    override fun loadTasks() {
        view.showLoading()
        
        repository.getTasks(object : TasksDataSource.LoadTasksCallback {
            override fun onTasksLoaded(tasks: List<Task>) {
                this@TasksPresenter.tasks = tasks
                view.hideLoading()
                view.showTasks(tasks)
            }
            
            override fun onDataNotAvailable() {
                view.hideLoading()
                view.showNoTasks()
            }
        })
    }
    
    override fun completeTask(task: Task) {
        repository.completeTask(task, object : TasksDataSource.CompleteTaskCallback {
            override fun onTaskCompleted() {
                view.showTaskMarkedComplete()
                loadTasks() // Reload all tasks
            }
            
            override fun onError() {
                view.showError("Failed to complete task")
            }
        })
    }
}

// MVP View (Activity/Fragment)
class TasksActivity : AppCompatActivity(), TasksContract.View {
    
    private lateinit var presenter: TasksContract.Presenter
    private lateinit var adapter: TasksAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tasks)
        
        presenter = TasksPresenter(this, TasksRepository.getInstance())
        presenter.loadTasks()
    }
    
    override fun showTasks(tasks: List<Task>) {
        adapter.updateTasks(tasks)
    }
    
    override fun showLoading() {
        findViewById<ProgressBar>(R.id.progress_bar).visibility = View.VISIBLE
    }
    
    // More view methods...
}
```

### After: MVVM Migration

```kotlin
// Migration Step 1: Convert Presenter to ViewModel
@HiltViewModel
class TasksViewModel @Inject constructor(
    private val repository: TasksRepository
) : ViewModel() {
    
    // Replace callbacks with StateFlow/LiveData
    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()
    
    init {
        loadTasks()
    }
    
    // Convert callback-based operations to coroutines
    private fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val tasks = repository.getTasks()
                _uiState.value = TasksUiState(
                    tasks = tasks,
                    isLoading = false,
                    isEmpty = tasks.isEmpty()
                )
            } catch (e: Exception) {
                _uiState.value = TasksUiState(
                    isLoading = false,
                    errorMessage = "Failed to load tasks"
                )
            }
        }
    }
    
    fun completeTask(task: Task) {
        viewModelScope.launch {
            try {
                repository.completeTask(task)
                // State updates automatically through repository
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to complete task"
                )
            }
        }
    }
}

// Migration Step 2: Update Repository to use Coroutines
@Singleton
class TasksRepository @Inject constructor(
    private val tasksDao: TasksDao,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) {
    // Replace callbacks with suspend functions
    suspend fun getTasks(): List<Task> = withContext(dispatcher) {
        tasksDao.getTasks()
    }
    
    suspend fun completeTask(task: Task) = withContext(dispatcher) {
        tasksDao.updateTask(task.copy(isCompleted = true))
    }
}

// Migration Step 3: Simplified Activity
@AndroidEntryPoint
class TasksActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            TodoTheme {
                TasksScreen()
            }
        }
    }
}
```

## Database Migration Strategies

### Migrating from SQLite to Room

```kotlin
// Legacy SQLite Helper
class LegacyDatabaseHelper(context: Context) : SQLiteOpenHelper(context, "tasks.db", null, 1) {
    
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE tasks (
                id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                is_completed INTEGER
            )
        """)
    }
    
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Handle upgrades
    }
}

// Migration to Room
@Database(
    entities = [Task::class],
    version = 2,
    exportSchema = true
)
@TypeConverters(DateConverter::class)
abstract class TodoDatabase : RoomDatabase() {
    abstract fun taskDao(): TasksDao
    
    companion object {
        // Migration from SQLite to Room
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Add new columns if needed
                database.execSQL("ALTER TABLE tasks ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0")
                database.execSQL("ALTER TABLE tasks ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0")
            }
        }
    }
}

// Data Migration Service
class DatabaseMigrationService @Inject constructor(
    private val legacyDb: LegacyDatabaseHelper,
    private val modernDb: TodoDatabase,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) {
    
    suspend fun migrateData() = withContext(dispatcher) {
        val legacyTasks = extractLegacyTasks()
        val modernTasks = convertToModernFormat(legacyTasks)
        modernDb.taskDao().insertTasks(modernTasks)
    }
    
    private fun extractLegacyTasks(): List<LegacyTask> {
        val cursor = legacyDb.readableDatabase.rawQuery("SELECT * FROM tasks", null)
        val tasks = mutableListOf<LegacyTask>()
        
        while (cursor.moveToNext()) {
            tasks.add(
                LegacyTask(
                    id = cursor.getString(cursor.getColumnIndex("id")),
                    title = cursor.getString(cursor.getColumnIndex("title")),
                    isCompleted = cursor.getInt(cursor.getColumnIndex("is_completed")) == 1
                )
            )
        }
        cursor.close()
        return tasks
    }
    
    private fun convertToModernFormat(legacyTasks: List<LegacyTask>): List<Task> {
        return legacyTasks.map { legacy ->
            Task(
                id = legacy.id,
                title = legacy.title,
                description = "", // Default value for new field
                isCompleted = legacy.isCompleted,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
        }
    }
}
```

## UI Migration: Views to Compose

### Migrating Fragment to Compose

```kotlin
// Legacy Fragment
class LegacyTasksFragment : Fragment() {
    
    private var _binding: FragmentTasksBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: TasksViewModel
    private lateinit var adapter: TasksAdapter
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTasksBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupFab()
        observeViewModel()
    }
    
    private fun setupRecyclerView() {
        adapter = TasksAdapter { task ->
            viewModel.completeTask(task.id)
        }
        binding.tasksList.adapter = adapter
    }
    
    private fun observeViewModel() {
        viewModel.tasks.observe(viewLifecycleOwner) { tasks ->
            adapter.submitList(tasks)
        }
        
        viewModel.loading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }
    }
}

// Hybrid Migration: Compose in Fragment
class ModernTasksFragment : Fragment() {
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setContent {
                TodoTheme {
                    TasksScreen()
                }
            }
        }
    }
}

// Full Compose Migration
@Composable
fun TasksScreen(
    viewModel: TasksViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Box(modifier = Modifier.fillMaxSize()) {
        when {
            uiState.isLoading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            uiState.tasks.isEmpty() -> {
                EmptyTasksContent(
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            else -> {
                TasksList(
                    tasks = uiState.tasks,
                    onTaskClick = viewModel::completeTask,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
        
        FloatingActionButton(
            onClick = { /* Navigate to add task */ },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add task")
        }
    }
}
```

### Gradual Compose Adoption Strategy

```kotlin
// Phase 1: Compose Views within existing layouts
class HybridTasksActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_hybrid_tasks)
        
        // Replace specific views with Compose
        findViewById<ViewGroup>(R.id.compose_container).apply {
            addView(
                ComposeView(this@HybridTasksActivity).apply {
                    setContent {
                        TasksFilterBar(
                            currentFilter = TasksFilterType.ALL_TASKS,
                            onFilterSelected = { /* Handle filter */ }
                        )
                    }
                }
            )
        }
        
        // Keep existing RecyclerView for now
        setupRecyclerView()
    }
    
    private fun setupRecyclerView() {
        // Existing RecyclerView setup
        findViewById<RecyclerView>(R.id.tasks_recycler_view).apply {
            adapter = TasksAdapter { task ->
                // Handle task interactions
            }
        }
    }
}

// Phase 2: Compose-first with View interop
@Composable
fun HybridTasksScreen() {
    Column {
        // New Compose UI
        TasksHeader()
        TasksFilterBar(
            currentFilter = TasksFilterType.ALL_TASKS,
            onFilterSelected = { /* Handle filter */ }
        )
        
        // Legacy RecyclerView wrapped in AndroidView
        AndroidView(
            factory = { context ->
                RecyclerView(context).apply {
                    layoutManager = LinearLayoutManager(context)
                    adapter = TasksAdapter { task ->
                        // Handle task click
                    }
                }
            },
            modifier = Modifier.weight(1f)
        ) { recyclerView ->
            // Update RecyclerView when needed
        }
    }
}

// Phase 3: Full Compose implementation
@Composable
fun FullComposeTasksScreen(
    viewModel: TasksViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LazyColumn {
        item {
            TasksHeader()
        }
        
        item {
            TasksFilterBar(
                currentFilter = uiState.currentFilter,
                onFilterSelected = viewModel::setFilter
            )
        }
        
        items(uiState.tasks, key = { it.id }) { task ->
            TaskItem(
                task = task,
                onTaskClick = { viewModel.completeTask(it.id) },
                onTaskLongClick = { /* Show context menu */ }
            )
        }
    }
}
```

## Navigation Migration

### Migrating from Fragment Navigation to Compose Navigation

```kotlin
// Legacy Fragment Navigation
class LegacyNavigationActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.container, TasksFragment.newInstance())
                .commit()
        }
    }
    
    fun navigateToAddTask() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.container, AddTaskFragment.newInstance())
            .addToBackStack(null)
            .commit()
    }
    
    fun navigateToTaskDetail(taskId: String) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.container, TaskDetailFragment.newInstance(taskId))
            .addToBackStack(null)
            .commit()
    }
}

// Modern Compose Navigation
@Composable
fun TodoNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = TodoDestinations.TASKS_ROUTE
    ) {
        composable(TodoDestinations.TASKS_ROUTE) {
            TasksScreen(
                onAddTask = {
                    navController.navigate(TodoDestinations.ADD_EDIT_TASK_ROUTE)
                },
                onTaskClick = { taskId ->
                    navController.navigate(
                        "${TodoDestinations.TASK_DETAIL_ROUTE}/$taskId"
                    )
                }
            )
        }
        
        composable(TodoDestinations.ADD_EDIT_TASK_ROUTE) {
            AddEditTaskScreen(
                onTaskSave = {
                    navController.popBackStack()
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(
            route = "${TodoDestinations.TASK_DETAIL_ROUTE}/{$TASK_ID_ARG}",
            arguments = listOf(navArgument(TASK_ID_ARG) { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString(TASK_ID_ARG)
            TaskDetailScreen(
                taskId = taskId,
                onEditTask = { 
                    navController.navigate("${TodoDestinations.ADD_EDIT_TASK_ROUTE}/$taskId")
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
```

## Testing During Migration

### Migration Testing Strategy

```kotlin
// Test both old and new implementations
@RunWith(Parameterized::class)
class MigrationTasksRepositoryTest(
    private val repositoryFactory: () -> TasksRepository
) {
    
    companion object {
        @JvmStatic
        @Parameterized.Parameters
        fun repositories() = listOf(
            arrayOf<() -> TasksRepository>({ LegacyTasksRepository() }),
            arrayOf<() -> TasksRepository>({ ModernTasksRepository() })
        )
    }
    
    private lateinit var repository: TasksRepository
    
    @Before
    fun setup() {
        repository = repositoryFactory()
    }
    
    @Test
    fun saveTask_retrievesTask() = runTest {
        // Test works for both implementations
        val task = Task(id = "1", title = "Test Task")
        repository.saveTask(task)
        
        val retrieved = repository.getTask("1")
        assertEquals(task.title, retrieved.title)
    }
}

// Feature flag testing
class MigrationFeatureFlagTest {
    
    @Test
    fun legacyFlow_whenFeatureFlagDisabled() {
        // Given
        val featureFlags = mockk<FeatureFlags>()
        every { featureFlags.isEnabled("new_tasks_implementation") } returns false
        
        // When
        val component = TasksComponent(featureFlags)
        
        // Then
        assertTrue(component.repository is LegacyTasksRepository)
    }
    
    @Test
    fun modernFlow_whenFeatureFlagEnabled() {
        // Given
        val featureFlags = mockk<FeatureFlags>()
        every { featureFlags.isEnabled("new_tasks_implementation") } returns true
        
        // When
        val component = TasksComponent(featureFlags)
        
        // Then
        assertTrue(component.repository is ModernTasksRepository)
    }
}
```

## Performance Monitoring During Migration

### Migration Metrics Collection

```kotlin
// Migration performance monitoring
class MigrationMetrics @Inject constructor(
    private val analytics: Analytics,
    private val performanceCollector: PerformanceCollector
) {
    
    fun trackScreenLoadTime(screen: String, isLegacy: Boolean, duration: Long) {
        analytics.track("screen_load_time", mapOf(
            "screen" to screen,
            "implementation" to if (isLegacy) "legacy" else "modern",
            "duration_ms" to duration
        ))
    }
    
    fun trackMemoryUsage(screen: String, isLegacy: Boolean) {
        val memoryInfo = performanceCollector.getMemoryInfo()
        analytics.track("memory_usage", mapOf(
            "screen" to screen,
            "implementation" to if (isLegacy) "legacy" else "modern",
            "heap_used_mb" to memoryInfo.heapUsedMB,
            "heap_max_mb" to memoryInfo.heapMaxMB
        ))
    }
    
    fun trackCrash(error: Throwable, isLegacy: Boolean) {
        analytics.track("migration_crash", mapOf(
            "implementation" to if (isLegacy) "legacy" else "modern",
            "error_type" to error::class.java.simpleName,
            "error_message" to error.message
        ))
    }
}

// Performance comparison wrapper
class PerformanceAwareTasksScreen @Composable() {
    
    @Composable
    operator fun invoke(migrationMetrics: MigrationMetrics) {
        val startTime = remember { System.currentTimeMillis() }
        
        // Track when screen is fully composed
        LaunchedEffect(Unit) {
            val loadTime = System.currentTimeMillis() - startTime
            migrationMetrics.trackScreenLoadTime("tasks", false, loadTime)
            migrationMetrics.trackMemoryUsage("tasks", false)
        }
        
        TasksScreen()
    }
}
```

## Migration Best Practices

### Rollback Strategy

```kotlin
// Circuit breaker pattern for migration rollback
class MigrationCircuitBreaker(
    private val featureFlags: FeatureFlags,
    private val analytics: Analytics
) {
    private var failureCount = 0
    private var lastFailureTime = 0L
    private val maxFailures = 5
    private val timeout = TimeUnit.MINUTES.toMillis(10)
    
    fun shouldUseModernImplementation(): Boolean {
        return when (getState()) {
            CircuitState.CLOSED -> true // Use modern implementation
            CircuitState.OPEN -> {
                analytics.track("migration_circuit_open")
                false // Fall back to legacy
            }
            CircuitState.HALF_OPEN -> {
                // Gradually test modern implementation
                Random.nextFloat() < 0.1f
            }
        }
    }
    
    fun recordSuccess() {
        failureCount = 0
    }
    
    fun recordFailure() {
        failureCount++
        lastFailureTime = System.currentTimeMillis()
        
        if (failureCount >= maxFailures) {
            analytics.track("migration_circuit_breaker_triggered", mapOf(
                "failure_count" to failureCount
            ))
        }
    }
    
    private fun getState(): CircuitState {
        return when {
            failureCount < maxFailures -> CircuitState.CLOSED
            System.currentTimeMillis() - lastFailureTime > timeout -> CircuitState.HALF_OPEN
            else -> CircuitState.OPEN
        }
    }
}
```

### Data Consistency During Migration

```kotlin
// Dual write strategy during migration
class DualWriteTasksRepository @Inject constructor(
    private val legacyRepository: LegacyTasksRepository,
    private val modernRepository: ModernTasksRepository,
    private val featureFlags: FeatureFlags,
    private val migrationMetrics: MigrationMetrics
) : TasksRepository {
    
    override suspend fun saveTask(task: Task) {
        val errors = mutableListOf<Exception>()
        
        // Write to legacy first (source of truth during migration)
        try {
            legacyRepository.saveTask(task)
        } catch (e: Exception) {
            errors.add(e)
            migrationMetrics.trackError("legacy_save_failed", e)
        }
        
        // Write to modern repository if enabled
        if (featureFlags.isEnabled("dual_write_modern")) {
            try {
                modernRepository.saveTask(task)
            } catch (e: Exception) {
                errors.add(e)
                migrationMetrics.trackError("modern_save_failed", e)
                // Don't fail the operation for modern repository errors during migration
            }
        }
        
        // Fail only if legacy write fails
        if (errors.isNotEmpty() && errors[0] is Exception) {
            throw errors[0]
        }
    }
    
    override suspend fun getTask(taskId: String): Task {
        return if (featureFlags.isEnabled("read_from_modern")) {
            try {
                modernRepository.getTask(taskId)
            } catch (e: Exception) {
                migrationMetrics.trackError("modern_read_fallback", e)
                legacyRepository.getTask(taskId)
            }
        } else {
            legacyRepository.getTask(taskId)
        }
    }
}
```

## Conclusion

Migrating legacy Android applications to modern architecture requires careful planning, incremental implementation, and comprehensive testing. Key strategies include:

- **Incremental Migration**: Use feature flags and gradual rollouts
- **Dual Implementation**: Run old and new systems in parallel during transition
- **Performance Monitoring**: Track metrics to ensure migration improves performance
- **Rollback Strategy**: Implement circuit breakers for quick fallback to legacy code
- **Data Consistency**: Use dual-write strategies during data layer migration
- **Testing**: Comprehensive testing of both legacy and modern implementations

By following these migration patterns, you can modernize your Android applications while minimizing risk and maintaining stability for your users. Remember that migration is a journey, not a destination—take it one step at a time and measure your progress along the way.

The goal is not just to update your technology stack, but to improve code maintainability, developer productivity, and user experience in the long run.