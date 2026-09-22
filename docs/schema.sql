USE [ComptaGeBdd]
GO

/****** Object:  Table [dbo].[Products]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Products](
	[ProductID] [int] IDENTITY(1,1) NOT NULL,
	[ProductName] [nvarchar](40) NOT NULL,
	[CategoryID] [int] NOT NULL,
 CONSTRAINT [PK_Products] PRIMARY KEY CLUSTERED 
(
	[ProductID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[Categories]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Categories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL,
	[idType] [int] NOT NULL,
	[CategoryName] [nvarchar](50) NOT NULL,
	[Description] [ntext] NULL,
	[Picture] [image] NULL,
 CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED 
(
	[CategoryID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Object:  Table [dbo].[Arborescence]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Arborescence](
	[CodeModule] [smallint] NULL,
	[Nom] [nvarchar](50) NULL,
	[CodeParent] [smallint] NULL,
	[CodeSuivant] [smallint] NULL,
	[Libelle] [nvarchar](50) NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[UserTable]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserTable](
	[AccesName] [nvarchar](15) NOT NULL,
	[Nom] [nvarchar](50) NULL,
	[Fonction] [nvarchar](20) NULL,
	[MotPasse] [nvarchar](100) NULL,
	[SystFonc] [nvarchar](2) NULL,
	[Background] [int] NULL,
	[Bicolor] [bit] NULL,
	[Color2] [int] NULL,
	[Inverse] [bit] NULL,
	[Sens] [tinyint] NULL,
	[TypeDegrade] [tinyint] NULL,
	[Rouge] [bit] NULL,
	[Vert] [bit] NULL,
	[Bleu] [bit] NULL,
	[Relief] [bit] NULL,
	[ClairFonce] [bit] NULL,
	[Vertical] [bit] NULL,
	[Horizontal] [bit] NULL,
	[FondTab] [int] NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[UserModule]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserModule](
	[CompteUser] [nvarchar](15) NULL,
	[CodeModule] [tinyint] NULL,
	[NomModule] [nvarchar](100) NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[TblProvince]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblProvince](
	[Nprovince] [int] NULL,
	[Nom] [nvarchar](50) NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblMvtEncaisse]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblMvtEncaisse](
	[idOperation] [int] IDENTITY(1,1) NOT NULL,
	[idBureau] [int] NULL,
	[NomBureau] [nvarchar](250) NULL,
	[idSens] [int] NOT NULL,
	[ProductsId] [int] NULL,
	[ProductsIdRoot] [int] NULL,
	[Categorie] [nvarchar](250) NULL,
	[ProductsName] [nvarchar](250) NULL,
	[dateOperation] [datetime] NULL,
	[Montant] [float] NULL,
	[idGestion] [int] NULL,
 CONSTRAINT [PK_tblMvtEncaisse] PRIMARY KEY CLUSTERED 
(
	[idOperation] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblMvt]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblMvt](
	[idOperation] [int] IDENTITY(1,1) NOT NULL,
	[idBureau] [int] NULL,
	[NomBureau] [nvarchar](250) NULL,
	[idSens] [int] NULL,
	[ProductsId] [int] NULL,
	[ProductsIdRoot] [int] NULL,
	[Categorie] [nvarchar](250) NULL,
	[ProductsName] [nvarchar](250) NULL,
	[dateOperation] [datetime] NULL,
	[Montant] [float] NULL,
	[Augmentation] [float] NULL,
	[Dimunition] [float] NULL,
	[MontantRectif] [float] NULL,
	[Motifs] [nvarchar](250) NULL,
	[idGestion] [int] NULL,
 CONSTRAINT [PK_TBLmVT] PRIMARY KEY CLUSTERED 
(
	[idOperation] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblMenuSub-old]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[tblMenuSub-old](
	[idMenu] [int] NOT NULL,
	[menuCode] [varchar](50) NULL,
	[menuName] [nvarchar](100) NULL,
	[menuSub] [int] IDENTITY(1,1) NOT NULL,
	[status] [nvarchar](1) NULL,
 CONSTRAINT [PK_tblMenuSub] PRIMARY KEY CLUSTERED 
(
	[menuSub] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO

/****** Object:  Table [dbo].[tblMenuSub]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblMenuSub](
	[idMenu] [int] NOT NULL,
	[compte] [nvarchar](50) NULL,
	[menuName] [nvarchar](250) NULL,
	[menuSub] [int] NOT NULL,
	[idMenuGreatPa] [int] NULL,
	[status] [nvarchar](1) NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblMenuParent]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[tblMenuParent](
	[idMenu] [int] IDENTITY(1,1) NOT NULL,
	[mainMenu] [varchar](50) NULL,
	[status] [varchar](1) NULL,
 CONSTRAINT [PK_tblMenuParent] PRIMARY KEY CLUSTERED 
(
	[idMenu] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO

/****** Object:  Table [dbo].[tblGestionBur]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblGestionBur](
	[idGestion] [int] IDENTITY(1,1) NOT NULL,
	[ncodique] [int] NOT NULL,
	[dateDebGest] [datetime] NOT NULL,
	[datefinGest] [datetime] NOT NULL,
	[Nomrec] [nvarchar](50) NOT NULL,
	[reservenum] [float] NULL,
	[valPost] [float] NULL,
	[timbreFisc] [float] NULL,
	[SoldeDebDepart] [float] NULL,
	[SoldeCredDepart] [float] NULL,
	[coupure] [bit] NULL,
 CONSTRAINT [PK_tblGestionBur] PRIMARY KEY CLUSTERED 
(
	[idGestion] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblEncaisseParent]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[tblEncaisseParent](
	[idEncaisse] [int] NOT NULL,
	[mainEncaisse] [varchar](50) NOT NULL
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO

/****** Object:  Table [dbo].[tblEncaisse]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblEncaisse](
	[idEncaisse] [int] NOT NULL,
	[compte] [nvarchar](50) NULL,
	[menuName] [nvarchar](250) NULL,
	[menuSub] [int] NOT NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblDesignationSitCompte]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblDesignationSitCompte](
	[idDesignation] [int] IDENTITY(1,1) NOT NULL,
	[Libelle] [nvarchar](250) NOT NULL,
 CONSTRAINT [PK_tblDesignationSitCompte] PRIMARY KEY CLUSTERED 
(
	[idDesignation] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblClassProduct]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tblClassProduct](
	[idProduits] [int] NOT NULL,
	[idSousCategories] [int] NOT NULL,
	[idCatgorie] [int] NOT NULL
) ON [PRIMARY]
GO

/****** Object:  Table [dbo].[tblClasse]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[tblClasse](
	[idType] [int] IDENTITY(1,1) NOT NULL,
	[TypeName] [char](10) NULL,
 CONSTRAINT [PK_tblClasse] PRIMARY KEY CLUSTERED 
(
	[idType] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO

/****** Object:  Table [dbo].[TblBureau]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TblBureau](
	[NFaritany] [int] NULL,
	[Nbur] [int] NULL,
	[codeclasse] [int] NULL,
	[NCODIQUE] [int] NULL,
	[Nombureau] [nvarchar](50) NULL,
	[Classe] [nvarchar](50) NULL,
	[CCP] [nvarchar](10) NULL,
	[NCF] [int] NULL,
	[CF_Codik] [int] NULL
) ON [PRIMARY]
GO

/****** Object:  View [dbo].[ReqSum]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[ReqSum]
AS
SELECT     SUM(Montant) AS SumMontant, SUM(Augmentation) AS SumAug, SUM(Dimunition) AS SumDim, SUM(MontantRectif) AS SumMttRectif
FROM         dbo.tblMvt
GO

/****** Object:  View [dbo].[VIEW1]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[VIEW1]
AS
SELECT     menuName
FROM         dbo.tblMenuSub
GO

/****** Object:  View [dbo].[bur]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[bur]
AS
SELECT     TOP (100) PERCENT Nombureau, NCODIQUE
FROM         dbo.TblBureau
ORDER BY Nombureau
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[21] 4[40] 2[3] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "TblBureau"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 208
               Right = 238
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
      Begin ColumnWidths = 9
         Width = 284
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'bur'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=1 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'bur'
GO

/****** Object:  View [dbo].[product]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[product]
AS
SELECT DISTINCT ProductsName
FROM         dbo.tblMvt
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[20] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "tblMvt"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 126
               Right = 238
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'product'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=1 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'product'
GO

/****** Object:  View [dbo].[MVT]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[MVT]
AS
SELECT     NomBureau, Categorie, ProductsName, dateOperation, Montant, Augmentation, Dimunition, MontantRectif, Motifs
FROM         dbo.tblMvt
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[20] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "tblMvt"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 126
               Right = 238
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
      Begin ColumnWidths = 9
         Width = 284
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'MVT'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=1 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'MVT'
GO

/****** Object:  View [dbo].[DIF]    Script Date: 03/09/2026 09:26:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[DIF]
AS
SELECT        TOP (100) PERCENT NomBureau, Categorie, ProductsName, dateOperation, Montant, Augmentation, Dimunition, MontantRectif, Motifs
FROM            dbo.MVT
WHERE        (Montant <> MontantRectif)
ORDER BY dateOperation
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[43] 4[19] 2[17] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "MVT"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 194
               Right = 238
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
      Begin ColumnWidths = 9
         Width = 284
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'DIF'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=1 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'DIF'
GO
