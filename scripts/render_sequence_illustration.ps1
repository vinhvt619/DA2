param(
  [string]$OutFile = "C:\Users\Son\Documents\GitHub\DA2\bao-cao\uml\sequence-dang-ky-dang-nhap-thanh-cong.png"
)

Add-Type -AssemblyName System.Drawing

$width = 2200
$height = 1540
$bmp = [System.Drawing.Bitmap]::new($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

$black = [System.Drawing.Brushes]::Black
$white = [System.Drawing.Brushes]::White
$blackPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2.2)
$thinPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.5)
$dashPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
$dashPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$lifelinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.7)
$lifelinePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$fontTitle = [System.Drawing.Font]::new("Arial", 30, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = [System.Drawing.Font]::new("Arial", 16)
$fontParticipant = [System.Drawing.Font]::new("Arial", 16, [System.Drawing.FontStyle]::Bold)
$fontMessage = [System.Drawing.Font]::new("Arial", 15)
$fontSection = [System.Drawing.Font]::new("Arial", 18, [System.Drawing.FontStyle]::Bold)

function Center-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font, [System.Drawing.Brush]$Brush = $black)
  $size = $g.MeasureString($Text, $Font)
  $g.DrawString($Text, $Font, $Brush, $X - ($size.Width / 2), $Y)
}

function Label-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font)
  if ($null -eq $Font) { $Font = $script:fontMessage }
  $size = $g.MeasureString($Text, $Font)
  $padX = 8
  $padY = 3
  $rect = [System.Drawing.RectangleF]::new($X - ($size.Width / 2) - $padX, $Y - $padY, $size.Width + (2 * $padX), $size.Height + (2 * $padY))
  $g.FillRectangle($white, $rect)
  $g.DrawString($Text, $Font, $black, $rect.X + $padX, $rect.Y + $padY)
}

function Draw-Arrow {
  param([float]$X1, [float]$Y, [float]$X2, [bool]$Return = $false)
  $pen = if ($Return) { $dashPen } else { $blackPen }
  $g.DrawLine($pen, $X1, $Y, $X2, $Y)
  $direction = if ($X2 -gt $X1) { 1 } else { -1 }
  $head = 12
  $g.DrawLine($blackPen, $X2, $Y, $X2 - ($direction * $head), $Y - 7)
  $g.DrawLine($blackPen, $X2, $Y, $X2 - ($direction * $head), $Y + 7)
}

function Draw-Message {
  param([float]$X1, [float]$Y, [float]$X2, [string]$Text, [bool]$Return = $false)
  Draw-Arrow -X1 $X1 -Y $Y -X2 $X2 -Return $Return
  Label-Text -Text $Text -X (($X1 + $X2) / 2) -Y ($Y - 22)
}

function Draw-Note {
  param([float]$X, [float]$Y, [float]$W, [string[]]$Lines)
  $h = 24 + ($Lines.Count * 20)
  $g.FillRectangle($white, $X, $Y, $W, $h)
  $g.DrawRectangle($thinPen, $X, $Y, $W, $h)
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    Center-Text -Text $Lines[$i] -X ($X + ($W / 2)) -Y ($Y + 8 + ($i * 20)) -Font $script:fontMessage
  }
}

# Header
Center-Text -Text "Sequence Diagram — Đăng ký và đăng nhập thành công" -X 1100 -Y 25 -Font $fontTitle
Center-Text -Text "Luồng chính của hệ thống (không bao gồm các nhánh lỗi)" -X 1100 -Y 62 -Font $fontSubtitle
$g.DrawLine($blackPen, 70, 95, 2130, 95)

# Participant headers and lifelines
$xs = @(195, 600, 1005, 1410, 1815)
$names = @("Người dùng", "React Auth UI", "AuthContext", "Express API", "MongoDB")
for ($i = 0; $i -lt $xs.Count; $i++) {
  $x = $xs[$i]
  $g.FillRectangle($white, $x - 125, 115, 250, 58)
  $g.DrawRectangle($blackPen, $x - 125, 115, 250, 58)
  Center-Text -Text $names[$i] -X $x -Y 134 -Font $fontParticipant
  $g.DrawLine($lifelinePen, $x, 173, $x, 1465)
}

# Activation bars
$activationPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
foreach ($bar in @(@(591,245,18,585), @(996,300,18,460), @(1401,355,18,405), @(591,960,18,460), @(996,1015,18,405), @(1401,1070,18,350))) {
  $g.FillRectangle($white, $bar[0], $bar[1], $bar[2], $bar[3])
  $g.DrawRectangle($activationPen, $bar[0], $bar[1], $bar[2], $bar[3])
}

# Registration section
Center-Text -Text "ĐĂNG KÝ" -X 1005 -Y 190 -Font $fontSection
Draw-Message 195 245 600 "Nhập thông tin đăng ký"
Draw-Message 600 300 1005 "Gửi yêu cầu đăng ký"
Draw-Message 1005 355 1410 "POST /api/register"
Draw-Message 1410 410 1815 "Kiểm tra tài khoản trùng"
Draw-Message 1815 465 1410 "Không có tài khoản trùng" $true
Draw-Note 1430 495 300 @("Mã hóa mật khẩu", "bằng bcrypt")
Draw-Message 1410 570 1815 "Lưu tài khoản mới"
Draw-Message 1815 625 1410 "Tài khoản được tạo thành công" $true
Draw-Message 1410 680 1005 "HTTP 201 — Đăng ký thành công" $true
Draw-Message 1005 735 600 "Cập nhật kết quả đăng ký" $true
Draw-Message 600 790 195 "Hiển thị thông báo đăng ký thành công" $true

# Divider and login section
$g.DrawLine($thinPen, 70, 850, 2130, 850)
Center-Text -Text "ĐĂNG NHẬP" -X 1005 -Y 835 -Font $fontSection
Draw-Message 195 910 600 "Nhập thông tin đăng nhập"
Draw-Message 600 965 1005 "Gửi yêu cầu đăng nhập"
Draw-Message 1005 1020 1410 "POST /api/login"
Draw-Message 1410 1075 1815 "Tìm tài khoản theo username"
Draw-Message 1815 1130 1410 "Trả về tài khoản và mật khẩu đã mã hóa" $true
Draw-Note 1430 1160 300 @("So sánh mật khẩu", "bằng bcrypt")
Draw-Note 1430 1220 300 @("Tạo mã xác thực và", "thiết lập cookie HTTP-only")
Draw-Message 1410 1290 1005 "HTTP 200 — Đăng nhập thành công + user" $true
Draw-Message 1005 1345 600 "Cập nhật trạng thái đăng nhập" $true
Draw-Message 600 1400 195 "Chuyển người dùng đến trang chính" $true
Center-Text -Text "Mũi tên liền: yêu cầu/thao tác  •  Mũi tên đứt: kết quả trả về" -X 1100 -Y 1495 -Font $fontSubtitle

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$blackPen.Dispose()
$thinPen.Dispose()
$dashPen.Dispose()
$lifelinePen.Dispose()
$activationPen.Dispose()
Write-Output $OutFile
