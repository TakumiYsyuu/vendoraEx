-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 21, 2026 at 09:01 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vendoradb`
--

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int UNSIGNED NOT NULL,
  `user_one` int NOT NULL,
  `user_two` int NOT NULL,
  `one_cleared_id` int UNSIGNED NOT NULL DEFAULT '0',
  `two_cleared_id` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `user_one`, `user_two`, `one_cleared_id`, `two_cleared_id`) VALUES
(1, 2, 3, 54, 66);

-- --------------------------------------------------------

--
-- Table structure for table `login_otps`
--

CREATE TABLE `login_otps` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `login_otps`
--

INSERT INTO `login_otps` (`id`, `user_id`, `device_id`, `code`, `used`, `expires_at`, `created_at`) VALUES
(14, 6, '54038fa2-2d93-4c5b-908f-d4e3c13a9771', '357687', 0, '2026-10-05 20:30:30', '2026-10-05 12:20:29'),
(15, 1, '54038fa2-2d93-4c5b-908f-d4e3c13a9771', '331318', 0, '2026-10-05 21:11:33', '2026-10-05 13:01:32'),
(16, 1, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '332820', 0, '2026-10-06 19:34:05', '2026-10-06 11:24:05'),
(17, 4, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '966024', 0, '2026-10-06 19:39:18', '2026-10-06 11:29:17'),
(18, 3, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '333493', 0, '2026-10-12 13:52:16', '2026-10-12 05:42:16'),
(19, 3, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '262865', 0, '2026-10-12 13:52:18', '2026-10-12 05:42:18'),
(20, 2, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '322735', 0, '2026-10-12 14:42:02', '2026-10-12 06:32:01'),
(21, 2, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '275079', 0, '2026-10-12 14:44:38', '2026-10-12 06:34:37'),
(22, 2, '43a7a578-fbbb-43e6-b340-f27e3bc20e7f', '532688', 0, '2026-10-12 15:29:46', '2026-10-12 07:19:46'),
(23, 2, '4c25875f-86a3-46c4-99a4-1e374b3a5423', '970920', 0, '2026-10-12 15:30:08', '2026-10-12 07:20:07'),
(24, 1, '4c25875f-86a3-46c4-99a4-1e374b3a5423', '516442', 0, '2026-10-12 15:32:23', '2026-10-12 07:22:23'),
(25, 3, '4c25875f-86a3-46c4-99a4-1e374b3a5423', '305339', 0, '2026-10-12 15:53:11', '2026-10-12 07:43:11'),
(26, 4, '4c25875f-86a3-46c4-99a4-1e374b3a5423', '612790', 0, '2026-10-12 21:54:14', '2026-10-12 13:44:13'),
(27, 3, '17942db7-f1b2-470d-afbc-2da76f2670ee', '271046', 0, '2026-10-15 14:19:13', '2026-10-15 06:09:12'),
(28, 1, '17942db7-f1b2-470d-afbc-2da76f2670ee', '645230', 0, '2026-10-15 15:52:02', '2026-10-15 07:42:01'),
(29, 2, '17942db7-f1b2-470d-afbc-2da76f2670ee', '809748', 0, '2026-10-15 17:40:53', '2026-10-15 09:30:52'),
(30, 2, '281ae69c-2225-4d86-944e-da426fa9531a', '740583', 0, '2026-10-19 13:57:16', '2026-10-19 05:47:16'),
(31, 3, '281ae69c-2225-4d86-944e-da426fa9531a', '408652', 0, '2026-10-20 12:18:36', '2026-10-20 04:08:36'),
(32, 4, '281ae69c-2225-4d86-944e-da426fa9531a', '515722', 0, '2026-10-20 12:43:41', '2026-10-20 04:33:40'),
(33, 1, '281ae69c-2225-4d86-944e-da426fa9531a', '439914', 0, '2026-10-20 12:46:08', '2026-10-20 04:36:07'),
(34, 3, '27394cd7-854a-4e8a-8e64-47d22b78f983', '602881', 0, '2026-10-20 19:03:30', '2026-10-20 10:53:29'),
(35, 3, '281ae69c-2225-4d86-944e-da426fa9531a', '363430', 0, '2026-10-20 20:04:03', '2026-10-20 11:54:03'),
(36, 3, '416b4ccf-21d1-4bf3-8bcf-3c0194ba03d9', '253904', 0, '2026-10-21 15:38:21', '2026-10-21 07:28:21'),
(37, 2, '416b4ccf-21d1-4bf3-8bcf-3c0194ba03d9', '437702', 0, '2026-10-21 15:44:36', '2026-10-21 07:34:36');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int UNSIGNED NOT NULL,
  `conversation_id` int UNSIGNED NOT NULL,
  `sender_id` int NOT NULL,
  `body` text,
  `image` varchar(255) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `body`, `image`, `read_at`, `created_at`) VALUES
(1, 1, 2, 'Hello', NULL, '2026-10-20 10:59:08', '2026-10-20 10:58:47'),
(2, 1, 2, 'Hello baby', NULL, '2026-10-20 10:59:38', '2026-10-20 10:59:28'),
(3, 1, 3, 'HEllo', NULL, '2026-10-20 10:59:47', '2026-10-20 10:59:44'),
(4, 1, 2, 'test', NULL, '2026-10-20 10:59:53', '2026-10-20 10:59:51'),
(5, 1, 3, 'kumain kana baby', NULL, '2026-10-20 11:00:05', '2026-10-20 11:00:04'),
(6, 1, 2, 'hindi pa e', NULL, '2026-10-20 11:00:11', '2026-10-20 11:00:09'),
(7, 1, 3, 'sige kain ka muna', '/uploads/f25f9351385429f4377632bcf7e0cdbc.jpg', '2026-10-20 11:01:17', '2026-10-20 11:01:13'),
(8, 1, 3, 'teseljhhoihlhkl', '/uploads/ce4b1135d394e1a69a1b3c8324956b6f.png', '2026-10-20 11:03:05', '2026-10-20 11:03:01'),
(9, 1, 2, 'pogi', NULL, '2026-10-20 11:03:17', '2026-10-20 11:03:12'),
(10, 1, 2, 'adadadada', NULL, '2026-10-20 11:10:33', '2026-10-20 11:09:16'),
(11, 1, 2, 'dasdasdasda', NULL, '2026-10-20 11:10:33', '2026-10-20 11:10:27'),
(12, 1, 2, 'Hello po babt', NULL, '2026-10-20 11:18:58', '2026-10-20 11:18:49'),
(13, 1, 3, 'helllo din baby gawa mo?', NULL, '2026-10-20 11:19:11', '2026-10-20 11:19:09'),
(14, 1, 3, 'asdasdas\\\\', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:22'),
(15, 1, 3, 'asdasd', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:22'),
(16, 1, 3, 'asd', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:23'),
(17, 1, 3, 'sd', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:23'),
(18, 1, 3, 'd', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:23'),
(19, 1, 3, 'sd', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:23'),
(20, 1, 3, 'asd', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:24'),
(21, 1, 3, 'a', NULL, '2026-10-20 11:19:26', '2026-10-20 11:19:24'),
(22, 1, 2, 'asdasd\\', NULL, '2026-10-20 11:19:34', '2026-10-20 11:19:33'),
(23, 1, 2, 'asdasd', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:10'),
(24, 1, 2, 'asda', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:11'),
(25, 1, 2, 'ad', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:12'),
(26, 1, 2, 'adsasda', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:14'),
(27, 1, 2, 'asdasd', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:15'),
(28, 1, 2, 'ad', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:20'),
(29, 1, 2, 'dadad', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:23'),
(30, 1, 2, 'asdasd', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:25'),
(31, 1, 2, 'asda', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:26'),
(32, 1, 2, 'asd', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:27'),
(33, 1, 2, 'asdasdasdasdadasdasdasdasdasdadadad', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:30'),
(34, 1, 2, 'ad', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:31'),
(35, 1, 2, 'a', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:31'),
(36, 1, 2, 'a', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:31'),
(37, 1, 2, 'da', NULL, '2026-10-20 11:29:52', '2026-10-20 11:29:31'),
(38, 1, 3, 'dsad', NULL, '2026-10-20 11:30:21', '2026-10-20 11:29:54'),
(39, 1, 3, 'asd', NULL, '2026-10-20 11:30:21', '2026-10-20 11:29:55'),
(40, 1, 3, 'as', NULL, '2026-10-20 11:30:21', '2026-10-20 11:29:55'),
(41, 1, 3, 'das', NULL, '2026-10-20 11:30:21', '2026-10-20 11:29:55'),
(42, 1, 3, 'das', NULL, '2026-10-20 11:30:21', '2026-10-20 11:29:55'),
(43, 1, 3, 'dasdasdadadadadadadadadadadada\'asdasd', NULL, '2026-10-20 11:30:21', '2026-10-20 11:30:09'),
(44, 1, 3, 'ad', NULL, '2026-10-20 11:30:21', '2026-10-20 11:30:09'),
(45, 1, 3, 'ad', NULL, '2026-10-20 11:30:21', '2026-10-20 11:30:09'),
(46, 1, 3, 'ad', NULL, '2026-10-20 11:30:21', '2026-10-20 11:30:10'),
(47, 1, 3, 'ad', NULL, '2026-10-20 11:30:21', '2026-10-20 11:30:10'),
(48, 1, 3, 'asdasd', NULL, '2026-10-20 11:30:42', '2026-10-20 11:30:38'),
(49, 1, 3, 'adasd', NULL, '2026-10-20 11:30:42', '2026-10-20 11:30:38'),
(50, 1, 3, 'asd', NULL, '2026-10-20 11:30:42', '2026-10-20 11:30:39'),
(51, 1, 3, 'asd', NULL, '2026-10-20 11:30:42', '2026-10-20 11:30:39'),
(52, 1, 3, 'sd', NULL, '2026-10-20 11:30:42', '2026-10-20 11:30:39'),
(53, 1, 2, 'Hello', '/uploads/6738a524be6c6677631efb3b5321ead3.jpg', '2026-10-20 12:02:39', '2026-10-20 12:01:14'),
(54, 1, 3, 'kumain kana ba?', NULL, '2026-10-20 12:03:08', '2026-10-20 12:02:48'),
(55, 1, 2, 'hello', NULL, '2026-10-20 12:08:19', '2026-10-20 12:06:10'),
(56, 1, 3, 'asdas', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:21'),
(57, 1, 3, 'das', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:21'),
(58, 1, 3, 'as', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:21'),
(59, 1, 3, 'das', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:21'),
(60, 1, 3, 'da', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:21'),
(61, 1, 3, 'dadadada\\', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:31'),
(62, 1, 3, 'asdasdasdad', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:33'),
(63, 1, 3, 'ada', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:34'),
(64, 1, 3, 'd', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:34'),
(65, 1, 3, 'd', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:34'),
(66, 1, 3, 'adadadadadadada', NULL, '2026-10-20 12:12:56', '2026-10-20 12:08:41'),
(67, 1, 2, NULL, '/uploads/f8eabf3289a1496a394260f38534b690.png', '2026-10-21 08:39:21', '2026-10-21 08:05:52');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `text`, `is_read`, `created_at`) VALUES
(18, 4, 'messages', 'Message received', 'MarkCruz sent you a message.', 1, '2026-10-13 16:57:40'),
(19, 4, 'orders', 'Report resolved', 'Report #12 was marked as resolved.', 1, '2026-10-13 16:57:40'),
(20, 3, 'seller_rejected', 'Seller verification not approved', 'Your seller verification was rejected. Reason: fix address.', 1, '2026-10-15 22:43:43'),
(21, 3, 'seller_approved', 'You\'re now a verified seller 🎉', 'Your seller verification has been approved. You can now start listing your products.', 1, '2026-10-15 22:44:22'),
(22, 3, 'seller_approved', 'You\'re now a verified seller 🎉', 'Your seller verification has been approved. You can now start listing your products.', 1, '2026-10-15 23:21:14'),
(23, 3, 'seller_rejected', 'Seller verification not approved', 'Your seller verification was rejected. Reason: fix address', 1, '2026-10-15 23:28:48'),
(24, 3, 'seller_approved', 'You\'re now a verified seller 🎉', 'Your seller verification has been approved. You can now start listing your products.', 1, '2026-10-15 23:29:23'),
(25, 3, 'messages', 'New message from ShilaMae', 'ShilaMae sent you a message.', 1, '2026-10-20 19:18:49'),
(28, 3, 'messages', 'New message from ShilaMae', 'ShilaMae sent you a message.', 1, '2026-10-20 19:19:33'),
(29, 3, 'messages', 'New message from ShilaMae', 'ShilaMae sent you 15 new messages.', 1, '2026-10-20 19:29:31'),
(30, 2, 'messages', 'New message from Mark GadgetShop', 'Mark GadgetShop sent you 10 new messages.', 1, '2026-10-20 19:30:10'),
(31, 2, 'messages', 'New message from Mark GadgetShop', 'Mark GadgetShop sent you 5 new messages.', 1, '2026-10-20 19:30:39'),
(32, 3, 'messages', 'New message from ShilaMae', 'ShilaMae sent you a message.', 1, '2026-10-20 20:01:14'),
(33, 2, 'messages', 'New message from Mark GadgetShop', 'Mark GadgetShop sent you a message.', 1, '2026-10-20 20:02:48'),
(34, 3, 'messages', 'New message from ShilaMae', 'ShilaMae sent you a message.', 1, '2026-10-20 20:06:10'),
(35, 2, 'messages', 'New message from Mark GadgetShop', 'Mark GadgetShop sent you 11 new messages.', 1, '2026-10-20 20:08:41'),
(36, 3, 'messages', 'New message from ShilaMae', 'ShilaMae sent you a message.', 1, '2026-10-21 16:05:52');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `attempts` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int UNSIGNED NOT NULL,
  `seller_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `stock` int UNSIGNED NOT NULL DEFAULT '0',
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `images` text,
  `status` enum('active','draft','archived') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `seller_id`, `name`, `category`, `description`, `price`, `stock`, `discount_percent`, `images`, `status`, `created_at`, `updated_at`) VALUES
(2, 3, 'Eawan', 'Toys & Games', 'asdasdasda', 120.00, 20, 20.00, '[\"/uploads/4e1e5a6abd315913e65cf4b989afdc58.png\"]', 'active', '2026-10-13 09:43:42', '2026-10-13 09:44:11'),
(3, 3, '12321321', 'Groceries', 'asdasdasdasda', 123123.00, 1231, 30.00, '[\"/uploads/4a197b15b29d1c433ba829fd74b31cef.png\"]', 'active', '2026-10-13 09:45:54', '2026-10-13 09:45:54'),
(4, 3, 'asdasd', 'Home & Living', 'asdasdad', 123.00, 3333, 1.00, '[\"/uploads/b006cbdcebfb37644fde7156eb098da2.png\"]', 'active', '2026-10-13 09:48:17', '2026-10-13 09:48:17'),
(5, 3, 'asdasda', 'Home & Living', 'asdasdasdasdasdadasd', 123.00, 123, 12.00, '[\"/uploads/863191dc47d8ee411e0f220bc406bb62.png\"]', 'active', '2026-10-13 10:00:50', '2026-10-13 10:00:50'),
(6, 3, 'TEst123', 'Others', 'TEstuyasidoad', 100.00, 4, 0.00, '[\"/uploads/b3c43adc4b9ca659bf6349f48942d308.png\"]', 'active', '2026-10-19 01:25:53', '2026-10-19 01:25:53'),
(7, 3, 'cahrt', 'Electronics', 'asdasdasdasdadasdas', 12.00, 1, 0.00, '[\"/uploads/d99a16aa474fbf251b1b59fb7686cba3.png\"]', 'active', '2026-10-19 05:07:06', '2026-10-19 05:07:06'),
(8, 3, 'asdasdadyiop2', 'Fashion', 'asdasdadadasdasda', 123.00, 123, 0.00, '[\"/uploads/1fc475d288e300c1df9aca983e39186b.png\"]', 'active', '2026-10-19 05:07:29', '2026-10-19 05:07:29');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int NOT NULL,
  `reporter_id` int NOT NULL,
  `reporter_role` varchar(20) NOT NULL,
  `source` enum('form','ai') NOT NULL,
  `reported_name` varchar(100) NOT NULL,
  `reported_email` varchar(120) DEFAULT NULL,
  `order_id` varchar(40) DEFAULT NULL,
  `subject` varchar(100) NOT NULL,
  `details` text NOT NULL,
  `ai_summary` text,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seller_verifications`
--

CREATE TABLE `seller_verifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `birth_date` date NOT NULL,
  `age` int NOT NULL,
  `id_type` varchar(100) NOT NULL,
  `id_image` varchar(255) NOT NULL,
  `parent_id_type` varchar(100) DEFAULT NULL,
  `parent_id_image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` text,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `seller_verifications`
--

INSERT INTO `seller_verifications` (`id`, `user_id`, `birth_date`, `age`, `id_type`, `id_image`, `parent_id_type`, `parent_id_image`, `status`, `rejection_reason`, `submitted_at`, `reviewed_at`, `reviewed_by`) VALUES
(12, 3, '2010-03-15', 16, 'Philippine National ID (PhilSys)', 'verification/dc2c40ff-08d9-40da-a555-0a8c2d36af6c.jpg', 'SSS ID', 'verification/e52a045f-d35b-4794-9618-704eadd3e117.jpg', 'rejected', 'fix address', '2026-10-15 15:28:30', '2026-10-15 15:28:48', 1),
(13, 3, '2010-03-15', 16, 'Philippine National ID (PhilSys)', 'verification/345f2767-632e-4a08-be44-b8f3e414bb07.jpg', 'SSS ID', 'verification/48d638cd-2b9c-420c-baf8-c14d4d13b461.jpg', 'approved', NULL, '2026-10-15 15:29:04', '2026-10-15 15:29:23', 1);

-- --------------------------------------------------------

--
-- Table structure for table `trusted_devices`
--

CREATE TABLE `trusted_devices` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `trusted_devices`
--

INSERT INTO `trusted_devices` (`id`, `user_id`, `device_id`, `created_at`) VALUES
(1, 5, '37af9487-ab7a-42bb-8e74-3c21c092758d', '2026-10-04 07:01:54'),
(2, 1, '281ae69c-2225-4d86-944e-da426fa9531a', '2026-10-04 08:12:20'),
(3, 2, '416b4ccf-21d1-4bf3-8bcf-3c0194ba03d9', '2026-10-04 08:14:44'),
(4, 3, '416b4ccf-21d1-4bf3-8bcf-3c0194ba03d9', '2026-10-04 08:15:48'),
(5, 4, '281ae69c-2225-4d86-944e-da426fa9531a', '2026-10-04 08:17:52'),
(6, 6, '54038fa2-2d93-4c5b-908f-d4e3c13a9771', '2026-10-04 08:18:27');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `fullname` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_num` varchar(30) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('shopper','seller','staff','admin') NOT NULL,
  `verification_status` enum('not_verified','pending','verified','rejected') NOT NULL DEFAULT 'not_verified',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `restriction_reason` varchar(500) DEFAULT NULL,
  `restriction_start` datetime DEFAULT NULL,
  `restriction_end` datetime DEFAULT NULL,
  `shop_name` varchar(150) DEFAULT NULL,
  `shop_description` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullname`, `email`, `phone_num`, `password`, `role`, `verification_status`, `is_active`, `created_at`, `updated_at`, `restriction_reason`, `restriction_start`, `restriction_end`, `shop_name`, `shop_description`) VALUES
(1, 'Admin', 'admin@vendora.com', '09000000000', '$2b$10$XzTSEjxmWbHSRpsFgjJ2fuh5.JPFnNABYafpO5qqTzlJD.Yqm7.e2', 'admin', 'verified', 1, '2026-09-25 01:31:13', '2026-09-28 04:04:23', NULL, NULL, NULL, NULL, NULL),
(2, 'ShilaMae', 'shilamae@gmail.com', '09345678909', '$2b$10$PCepTeA9AGKu7w4hU0ofO.LPpr4tnCW.SAzJpb0NWo7pNy2/pJlUO', 'shopper', 'not_verified', 1, '2026-09-25 10:12:51', '2026-09-25 10:12:51', NULL, NULL, NULL, NULL, NULL),
(3, 'MarkCruz', 'markcruz@gmail.com', '09876545321', '$2b$10$vLgNVZfqUD9IvROORUwZsOgoc8Ew4ETbrYcZwZ1Mq7EO94gKSBVse', 'seller', 'verified', 1, '2026-09-25 10:14:13', '2026-10-15 15:29:23', NULL, NULL, NULL, 'Mark GadgetShop', 'Quality products and everyday essentials.'),
(4, 'ErikaSantoS', 'erika@vendora.com', '091111111111', '$2b$10$8hv74jQYQCFFibL0AMuEV.NskrBxg97td6cwtoXzSTyCmDzsmRPJq', 'staff', 'verified', 1, '2026-09-29 09:05:18', '2026-10-15 09:03:37', NULL, NULL, NULL, NULL, NULL),
(5, 'MonMon', 'jrvictor024@gmail.com', '09876543212', '$2b$10$YBhPUzwDzDMv0vJ2Spo91OIKcOSvnAmmo9oi36gleCruZThgbCzZa', 'shopper', 'not_verified', 1, '2026-09-29 11:03:47', '2026-10-04 07:00:24', NULL, NULL, NULL, NULL, NULL),
(6, 'AngelaSantos', 'Angela@gmail.com', '09878654543', '$2b$10$bF9TEmFdOVnSoorPmU31m.FW7rfU28r4Op1apQNKMb6vfnKMZLkf6', 'seller', 'not_verified', 1, '2026-10-04 06:00:49', '2026-10-04 06:00:49', NULL, NULL, NULL, NULL, NULL),
(7, 'ReneButter', 'rene@gmail.com', '0969696969', '$2b$10$oG5/TlnrZsHILxOMxlQAlOZB10Q/nG5hYZYEN4kVl7nrc0nSiAdMa', 'shopper', 'not_verified', 1, '2026-10-12 11:03:33', '2026-10-15 07:18:22', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(4, 2, 7, '2026-10-20 10:54:35'),
(7, 2, 8, '2026-10-20 10:55:17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pair` (`user_one`,`user_two`),
  ADD KEY `user_two` (`user_two`);

--
-- Indexes for table `login_otps`
--
ALTER TABLE `login_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation` (`conversation_id`,`id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `seller_id` (`seller_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reports_status` (`status`,`created_at`),
  ADD KEY `idx_reports_reporter` (`reporter_id`);

--
-- Indexes for table `seller_verifications`
--
ALTER TABLE `seller_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `trusted_devices`
--
ALTER TABLE `trusted_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_device` (`user_id`,`device_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `login_otps`
--
ALTER TABLE `login_otps`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_verifications`
--
ALTER TABLE `seller_verifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `trusted_devices`
--
ALTER TABLE `trusted_devices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_one`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user_two`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `login_otps`
--
ALTER TABLE `login_otps`
  ADD CONSTRAINT `login_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seller_verifications`
--
ALTER TABLE `seller_verifications`
  ADD CONSTRAINT `seller_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `seller_verifications_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `trusted_devices`
--
ALTER TABLE `trusted_devices`
  ADD CONSTRAINT `trusted_devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
