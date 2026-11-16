param(
  [string]$OutFile = "C:\Users\Son\Documents\GitHub\DA2\bao-cao\uml\sequence-dang-ky-dang-nhap-thanh-cong-that-bai-loop.png"
)

Add-Type -AssemblyName System.Drawing

$width = 2300
$height = 2250
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
$framePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.8)
$framePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$lifelinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.7)
$lifelinePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$activationPen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 2)
$fontTitle = [System.Drawing.Font]::new("Arial", 28, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = [System.Drawing.Font]::new("Arial", 15)
$fontParticipant = [System.Drawing.Font]::new("Arial", 15, [System.Drawing.FontStyle]::Bold)
$fontMessage = [System.Drawing.Font]::new("Arial", 14)
$fontFrame = [System.Drawing.Font]::new("Arial", 15, [System.Drawing.FontStyle]::Bold)

function Center-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font, [System.Drawing.Brush]$Brush = $black)
  $size = $g.MeasureString($Text, $Font)
  $g.DrawString($Text, $Font, $Brush, $X - ($size.Width / 2), $Y)
}

function Label-Text {
  param([string]$Text, [float]$X, [float]$Y, [System.Drawing.Font]$Font)
  $size = $g.MeasureString($Text, $Font)
  $padX = 7
  $padY = 2
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
  Label-Text -Text $Text -X (($X1 + $X2) / 2) -Y ($Y - 20) -Font $fontMessage
}

function Draw-Note {
  param([float]$X, [float]$Y, [float]$W, [string[]]$Lines)
  $h = 16 + ($Lines.Count * 19)
  $g.FillRectangle($white, $X, $Y, $W, $h)
  $g.DrawRectangle($thinPen, $X, $Y, $W, $h)
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    Center-Text -Text $Lines[$i] -X ($X + ($W / 2)) -Y ($Y + 4 + ($i * 19)) -Font $fontMessage
  }
}

function Draw-Frame {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [string]$Label, [bool]$Dashed = $false)
  $pen = if ($Dashed) { $framePen } else { $thinPen }
  $g.DrawRectangle($pen, $X, $Y, $W, $H)
  $size = $g.MeasureString($Label, $fontFrame)
  $g.FillRectangle($white, $X + 12, $Y - 2, $size.Width + 16, $size.Height + 5)
  $g.DrawString($Label, $fontFrame, $black, $X + 20, $Y + 1)
}

# Header
Center-Text -Text "Sequence Diagram — Đăng ký và đăng nhập: thành công / thất bại" -X 1150 -Y 23 -Font $fontTitle
Center-Text -Text "Nhánh thất bại quay lại bước nhập thông tin; nhánh thành công thoát khỏi vòng lặp" -X 1150 -Y 58 -Font $fontSubtitle
$g.DrawLine($blackPen, 55, 88, 2245, 88)

# Participants and lifelines
$xs = @(190, 600, 1000, 1400, 1810)
$names = @("Người dùng", "React Auth UI", "AuthContext", "Express API", "MongoDB")
for ($i = 0; $i -lt $xs.Count; $i++) {
  $x = $xs[$i]
  $g.FillRectangle($white, $x - 125, 105, 250, 55)
  $g.DrawRectangle($blackPen, $x - 125, 105, 250, 55)
  Center-Text -Text $names[$i] -X $x -Y 122 -Font $fontParticipant
  $g.DrawLine($lifelinePen, $x, 160, $x, 2140)
}

# ==================== REGISTRATION ====================
Draw-Frame -X 55 -Y 190 -W 2190 -H 900 -Label "loop [Người dùng chọn thử lại]" -Dashed $true
Center-Text -Text "ĐĂNG KÝ" -X 1150 -Y 210 -Font $fontFrame

foreach ($bar in @(@(591,255,18,735), @(991,305,18,685), @(1391,355,18,635))) {
  $g.FillRectangle($white, $bar[0], $bar[1], $bar[2], $bar[3])
  $g.DrawRectangle($activationPen, $bar[0], $bar[1], $bar[2], $bar[3])
}

Draw-Message 190 265 600 "Nhập thông tin đăng ký"
Draw-Message 600 315 1000 "Gửi yêu cầu đăng ký"
Draw-Message 1000 365 1400 "POST /api/register"
Draw-Message 1400 415 1810 "Kiểm tra username/email"
Draw-Message 1810 465 1400 "Tài khoản đã tồn tại hoặc không trùng" $true

Draw-Frame -X 90 -Y 515 -W 2120 -H 540 -Label "alt [Kết quả đăng ký]"
$g.DrawLine($thinPen, 90, 770, 2210, 770)
Label-Text -Text "[Đăng ký thất bại]" -X 235 -Y 535 -Font $fontMessage
Label-Text -Text "[Đăng ký thành công]" -X 235 -Y 790 -Font $fontMessage

# Registration failure branch
Draw-Message 1400 590 1000 "HTTP 400 – Tên đăng nhập hoặc email đã tồn tại" $true
Draw-Message 1000 650 600 "Hiển thị thông báo lỗi" $true
Draw-Message 600 710 190 "Yêu cầu sửa và gửi lại thông tin" $true

# Registration success branch
Draw-Note 1420 815 330 @("Mã hóa mật khẩu", "bằng bcrypt")
Draw-Message 1400 865 1810 "Lưu tài khoản mới" 
Draw-Message 1810 915 1400 "Tài khoản được tạo thành công" $true
Draw-Message 1400 965 1000 "HTTP 201 – Đăng ký thành công" $true
Draw-Message 1000 1015 600 "Cập nhật kết quả đăng ký" $true
Draw-Message 600 1065 190 "Hiển thị thông báo thành công" $true

# Divider
$g.DrawLine($thinPen, 55, 1140, 2245, 1140)
Center-Text -Text "ĐĂNG NHẬP" -X 1150 -Y 1155 -Font $fontFrame

# ==================== LOGIN ====================
Draw-Frame -X 55 -Y 1185 -W 2190 -H 900 -Label "loop [Người dùng chọn thử lại]" -Dashed $true

foreach ($bar in @(@(591,1250,18,735), @(991,1300,18,685), @(1391,1350,18,635))) {
  $g.FillRectangle($white, $bar[0], $bar[1], $bar[2], $bar[3])
  $g.DrawRectangle($activationPen, $bar[0], $bar[1], $bar[2], $bar[3])
}

Draw-Message 190 1260 600 "Nhập thông tin đăng nhập"
Draw-Message 600 1310 1000 "Gửi yêu cầu đăng nhập"
Draw-Message 1000 1360 1400 "POST /api/login"
Draw-Message 1400 1410 1810 "Tìm tài khoản theo username"
Draw-Message 1810 1460 1400 "Trả về User hoặc null" $true
Draw-Note 1420 1480 330 @("Kiểm tra tài khoản và", "so sánh mật khẩu bằng bcrypt")

Draw-Frame -X 90 -Y 1525 -W 2120 -H 540 -Label "alt [Kết quả đăng nhập]"
$g.DrawLine($thinPen, 90, 1780, 2210, 1780)
Label-Text -Text "[Đăng nhập thất bại]" -X 235 -Y 1545 -Font $fontMessage
Label-Text -Text "[Đăng nhập thành công]" -X 235 -Y 1800 -Font $fontMessage

# Login failure branch
Draw-Message 1400 1600 1000 "HTTP 400 – Tài khoản hoặc mật khẩu không chính xác" $true
Draw-Message 1000 1660 600 "Hiển thị thông báo lỗi" $true
Draw-Message 600 1720 190 "Yêu cầu nhập lại thông tin" $true

# Login success branch
Draw-Note 1415 1825 350 @("Tạo mã xác thực và", "thiết lập cookie HTTP-only")
Draw-Message 1400 1880 1000 "HTTP 200 – Đăng nhập thành công + user" $true
Draw-Message 1000 1940 600 "Cập nhật trạng thái đăng nhập" $true
Draw-Message 600 2000 190 "Chuyển đến trang chính" $true

Center-Text -Text "Khi thất bại, loop quay lại bước nhập thông tin; khi thành công, dùng break để thoát loop." -X 1150 -Y 2160 -Font $fontSubtitle
Center-Text -Text "Mũi tên liền: yêu cầu/thao tác  •  Mũi tên đứt: kết quả trả về" -X 1150 -Y 2190 -Font $fontSubtitle

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$blackPen.Dispose()
$thinPen.Dispose()
$dashPen.Dispose()
$framePen.Dispose()
$lifelinePen.Dispose()
$activationPen.Dispose()
Write-Output $OutFile
